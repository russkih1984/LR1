// ссылка на блок веб-страницы, в котором будет отображаться графика
var container;

// переменные: камера, сцена и отрисовщик
var camera, scene, renderer;

var N = 255;

// глобальная переменная для хранения карты высот
var imagedata;

// создание точечного источника освещения заданного цвета
var spotlight = new THREE.PointLight(0xffffff);
var a = 0;
var sphere;
var terrainMesh;

// функция инициализации камеры, отрисовщика, объектов сцены и т.д.
init();

// обновление данных по таймеру браузера
//animate();

// в этой функции можно добавлять объекты и выполнять их первичную настройку
function init() 
{
    // получение ссылки на блок html-страницы
    container = document.getElementById('container');
    // создание сцены
    scene = new THREE.Scene();

    // установка параметров камеры
    // 45 - угол обзора
    // window.innerWidth / window.innerHeight - соотношение сторон
    // 1 и 4000 - ближняя и дальняя плоскости отсечения
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);    
   
    // установка позиции камеры
    camera.position.set(N/2, N/2, N*1.5);
    
    // установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3(N/2, 0, N/2));  

    // создание отрисовщика
    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize(window.innerWidth, window.innerHeight);
    // закрашивание экрана синим цветом, заданным в шестнадцатеричной системе
    renderer.setClearColor(0x000000ff, 1);

    container.appendChild(renderer.domElement);

    // добавление обработчика события изменения размеров окна
    window.addEventListener('resize', onWindowResize, false);
 
    // создание точечного источника освещения заданного цвета
    //var spotlight = new THREE.PointLight(0xffffff);
    // установка позиции источника освещения
    spotlight.position.set(N, N, N/2);

    // добавление источника в сцену
    scene.add(spotlight);

    var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
    sphere = new THREE.Mesh( geometry, material );
    scene.add( sphere );

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image();

    img.onload = function()
    {
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        imagedata = context.getImageData(0, 0, img.width, img.height);

        // пользовательская функция генерации ландшафта
        addTerrain();
        animate();
    }
    // загрузка изображения с картой высот
    img.src = 'pic/plateau.jpg';
}

function getPixel(imagedata, x, y) 
{
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;
    return data[ position ];
}

function onWindowResize() 
{
    // изменение соотношения сторон для виртуальной камеры
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    // изменение соотношения сторон рендера
    renderer.setSize(window.innerWidth, window.innerHeight);
}
// в этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate() 
{
    // добавление функции на вызов при перерисовке браузером страницы 
    requestAnimationFrame( animate );
    render();   

    a += 0.01;

    var x = N/2 + N/2 * Math.cos(a);
    var y = 0 + N/2 * Math.sin(a);

    spotlight.position.set(x, y, N/2);

    sphere.position.set(x, y, N/2);          
    
    terrainMesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), 0.01);
    

}

function render() 
{
    // рисование кадра
    renderer.render(scene, camera);
}

function addTerrain()
{
    // cоздание структуры для хранения вершин
    var geometry = new THREE.Geometry();
    
    for(var i = 0; i < N; i++)
    for(var j = 0; j < N; j++)
    {
        var y = getPixel(imagedata, i, j)/10.0;
        // добавление координат вершин в массив вершин
        geometry.vertices.push(new THREE.Vector3( i-N/2, y, j-N/2));//0
    }

    //geometry.vertices.push(new THREE.Vector3(0.0, 3.0, 0.0));//1
    //geometry.vertices.push(new THREE.Vector3(3.0, 3.0, 1.0));//2
    //geometry.vertices.push(new THREE.Vector3(3.0, 0.0, 1.0));//3

    for(var i = 0; i < N-1; i++)
    for(var j = 0; j < N-1; j++)
    {
        // добавление индексов (порядок соединения вершин) в массив индексов  
        geometry.faces.push(new THREE.Face3(i + j *N, (i+1) + j *N, (i+1) + (j+1) *N));
        geometry.faces.push(new THREE.Face3(i + j *N, (i+1) + (j+1) *N, i + (j+1) *N));
    
        geometry.faceVertexUvs[0].push([new THREE.Vector2(i/N, j/N),
            new THREE.Vector2(i/N, (j+1)/N),
            new THREE.Vector2((i+1)/N, (j+1)/N)]);
        
        geometry.faceVertexUvs[0].push([new THREE.Vector2(i/N, j/N),
            new THREE.Vector2((i+1)/N, (j+1)/N),
            new THREE.Vector2((i+1)/N, j/N)]);
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    // создание загрузчика текстур
    var loader = new THREE.TextureLoader();
    // загрузка текстуры grasstile.jpg из папки pic
    var tex = loader.load( 'pic/grasstile.jpg' );

    // режим повторения текстуры
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; 
    // повторить текстуру 10 на 10 раз
    tex.repeat.set(5, 5);


    var triangleMaterial = new THREE.MeshLambertMaterial({
        map: tex, // источник цвета - текстура
        wireframe: false,
        side:THREE.DoubleSide    
        });

    // создание объекта и установка его в определённую позицию
    terrainMesh   = new THREE.Mesh(geometry, triangleMaterial);

    terrainMesh.position.set(N/2, 0.0, N/2);
    
    // добавление объекта в сцену     
    scene.add(terrainMesh);



}


