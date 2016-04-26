var bodyLength = 150;
var headRadius = 40;
var neckLength = 25;
var armTopLength = 75;
var armBottomLength = 75;
var legTopLength = 75;
var legBottomLength = 75;
var controllerWidth = 20;
var paddingWidth = controllerWidth + 50;

var bodyMaxAngle = 120;
var neckMaxAngle = 120;
var armTopMaxAngle = 180;
var armBottomMaxAngle = 180;
var legTopMaxAngle = 90;
var legBottomMaxAngle = 90;

var originalDistance = 300;
var defaultDistance = 100;
var screenWidth, screenHeight;
var centerX, centerY;

var startTime = 0;
var timeLimit = 15;
var passableCheck = false;
var finishing = 5;
var transitionWeight = 0.1;

var wall = {
    width: 800,
    height: 500,
    distance: defaultDistance
};
var defaultPerson = {
    pivot: {x: 0, y: 0},
    body: 0,
    neck: 0,
    armTopLeft: -135,
    armTopRight: 135,
    armBottomLeft: -45,
    armBottomRight: 45,
    legTopLeft: -135,
    legTopRight: 135,
    legBottomLeft: -45,
    legBottomRight: 45
};
var map = clone(defaultPerson);
var controller = clone(defaultPerson);
var dead1Controller = {
    pivot: {x: 0, y: 0},
    body: -90,
    neck: 0,
    armTopLeft: -180,
    armTopRight: 180,
    armBottomLeft: 0,
    armBottomRight: 0,
    legTopLeft: -270,
    legTopRight: 90,
    legBottomLeft: 0,
    legBottomRight: 0
};
var dead2Controller = {
    pivot: {x: 0, y: 0},
    body: 90,
    neck: 0,
    armTopLeft: -180,
    armTopRight: 180,
    armBottomLeft: 0,
    armBottomRight: 0,
    legTopLeft: -90,
    legTopRight: 270,
    legBottomLeft: 0,
    legBottomRight: 0
};
var winController = {
    pivot: {x: 0, y: 0},
    body: 0,
    neck: 0,
    armTopLeft: -90,
    armTopRight: 90,
    armBottomLeft: 45,
    armBottomRight: -45,
    legTopLeft: -135,
    legTopRight: 135,
    legBottomLeft: -45,
    legBottomRight: 45
};
var realController = {
    pivot: {x: 0, y: 0},
    body: {x: 0, y: 0},
    armTopLeft: {x: 0, y: 0},
    armBottomLeft: {x: 0, y: 0},
    armTopRight: {x: 0, y: 0},
    armBottomRight: {x: 0, y: 0},
    legTopLeft: {x: 0, y: 0},
    legBottomLeft: {x: 0, y: 0},
    legTopRight: {x: 0, y: 0},
    legBottomRight: {x: 0, y: 0},
    neck: {x: 0, y: 0}
};

function clone(obj) {
    if (null == obj || "object" != typeof obj) return obj;
    var copy = obj.constructor();
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function getDistance(touch, object) {
    return Math.sqrt(Math.pow(touch.x - object.x, 2) + Math.pow(touch.y - object.y, 2));
}

function getAngle(touch, object) {
    return -Math.atan2(touch.x - object.x, touch.y - object.y) / Math.PI * 180;
}

function getDistanceBetweenLineAndPoint(v1, v2, p) {
    var normalLength = Math.sqrt((v1.x - v2.x) * (v1.x - v2.x) + (v1.y - v2.y) * (v1.y - v2.y));
    return Math.abs((p.x - v2.x) * (v1.y - v2.y) - (p.y - v2.y) * (v1.x - v2.x)) / normalLength;
}

function isBetweenSegment(v1, v2, p) {
    var v = Math.pow(getDistance(v1, v2), 2);
    var s1 = Math.pow(getDistance(v1, p), 2);
    var s2 = Math.pow(getDistance(v2, p), 2);
    return v + s1 >= s2 && v + s2 >= s1;
}

function getOtherVertex(vertex) {
    switch (vertex) {
        case 'body':
            return 'pivot';
        case 'neck':
            return 'body';
        case 'armTopLeft':
            return 'body';
        case 'armTopRight':
            return 'body';
        case 'armBottomLeft':
            return 'armTopLeft';
        case 'armBottomRight':
            return 'armTopRight';
        case 'legTopLeft':
            return 'pivot';
        case 'legTopRight':
            return 'pivot';
        case 'legBottomLeft':
            return 'legTopLeft';
        case 'legBottomRight':
            return 'legTopRight';
        default:
            return null;
    }
}

var canvas = document.getElementById('myCanvas');
var context = canvas.getContext('2d');

var getScreenSize = function () {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    centerX = screenWidth / 2;
    centerY = screenHeight / 2;
    context.canvas.width = screenWidth;
    context.canvas.height = screenHeight;
};

window.onload = window.onresize = getScreenSize;

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

function getPivotY(pivot, body, armTopLeft, armBottomLeft, armTopRight, armBottomRight, legTopLeft, legBottomLeft, legTopRight, legBottomRight, neck, head) {
    var compare = [pivot, body, armTopLeft, armBottomLeft, armTopRight, armBottomRight, legTopLeft, legBottomLeft, legTopRight, legBottomRight, neck, head];
    var minY = 0;
    compare.forEach(function (y) {
        if (minY > y) minY = y;
    });
    return minY;
}

function drawRail(context) {
    var nearZoom = Math.max(screenWidth / wall.width, screenHeight / wall.height);

    context.beginPath();

    context.shadowColor = 0;
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    context.lineWidth = 0;
    context.fillStyle = '#ff0';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX - wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.lineTo(centerX + wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.closePath();
    context.fill();

    context.strokeStyle = '#f00';
    context.setLineDash([15]);
    context.lineWidth = 5;
    context.lineCap = 'square';
    context.fillStyle = '';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX, centerY + wall.height * 0.75 / 2);
    context.stroke();
    context.closePath();

    context.lineWidth = 0;
    context.fillStyle = '#f00';
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(centerX - wall.width * 0.75 / 2, centerY + wall.height * 0.75 / 2);
    context.lineTo(centerX + wall.width * 0.75 / 2, centerY + wall.height * 0.75 / 2);
    context.lineTo(centerX + wall.width * 1.05 / 2, centerY + wall.height * 1.05 / 2);
    context.lineTo(centerX - wall.width * 1.05 / 2, centerY + wall.height * 1.05 / 2);
    context.closePath();
    context.fill();

    context.strokeStyle = '#000';
    context.lineWidth = 10;
    context.lineCap = 'square';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX - wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.stroke();
    context.closePath();

    context.strokeStyle = '#ddd';
    context.lineWidth = 5;
    context.lineCap = 'square';
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX - wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.stroke();
    context.closePath();

    context.strokeStyle = '#000';
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX + wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.stroke();
    context.closePath();

    context.strokeStyle = '#ddd';
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.lineTo(centerX + wall.width * nearZoom / 2, centerY + wall.height * nearZoom / 2);
    context.stroke();
    context.closePath();
}

function drawWall(context) {
    var zoom = wall.distance / originalDistance;
    var realWidth = wall.width * zoom;
    var realHeight = wall.height * zoom;

    context.beginPath();

    context.shadowColor = '#999';
    context.shadowBlur = 10;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 15 * zoom;

    context.drawImage(wallImage, centerX - realWidth / 2, centerY - realHeight / 2, realWidth, realHeight);

    drawMap(context);
    drawController(context);

    context.closePath();
}

var mapImageData = null;
function drawPerson(person, zoom, context) {
    var realPivotX = centerX + person.pivot.x * zoom;
    var realPivotY = centerY + (wall.height / 2 - person.pivot.y) * zoom;

    var realBodyX = bodyLength * Math.sin(toRadians(person.body)) * zoom;
    var realBodyY = bodyLength * Math.cos(toRadians(person.body)) * zoom;

    var realArmTopLeftX = realBodyX + armTopLength * Math.sin(toRadians(person.body + person.armTopLeft)) * zoom;
    var realArmTopLeftY = realBodyY + armTopLength * Math.cos(toRadians(person.body + person.armTopLeft)) * zoom;

    var realArmBottomLeftX = realArmTopLeftX + armBottomLength * Math.sin(toRadians(person.body + person.armTopLeft + person.armBottomLeft)) * zoom;
    var realArmBottomLeftY = realArmTopLeftY + armBottomLength * Math.cos(toRadians(person.body + person.armTopLeft + person.armBottomLeft)) * zoom;

    var realArmTopRightX = realBodyX + armTopLength * Math.sin(toRadians(person.body + person.armTopRight)) * zoom;
    var realArmTopRightY = realBodyY + armTopLength * Math.cos(toRadians(person.body + person.armTopRight)) * zoom;

    var realArmBottomRightX = realArmTopRightX + armBottomLength * Math.sin(toRadians(person.body + person.armTopRight + person.armBottomRight)) * zoom;
    var realArmBottomRightY = realArmTopRightY + armBottomLength * Math.cos(toRadians(person.body + person.armTopRight + person.armBottomRight)) * zoom;

    var realLegTopLeftX = legTopLength * Math.sin(toRadians(person.legTopLeft)) * zoom;
    var realLegTopLeftY = legTopLength * Math.cos(toRadians(person.legTopLeft)) * zoom;

    var realLegBottomLeftX = realLegTopLeftX + legBottomLength * Math.sin(toRadians(person.legTopLeft + person.legBottomLeft)) * zoom;
    var realLegBottomLeftY = realLegTopLeftY + legBottomLength * Math.cos(toRadians(person.legTopLeft + person.legBottomLeft)) * zoom;

    var realLegTopRightX = legTopLength * Math.sin(toRadians(person.legTopRight)) * zoom;
    var realLegTopRightY = legTopLength * Math.cos(toRadians(person.legTopRight)) * zoom;

    var realLegBottomRightX = realLegTopRightX + legBottomLength * Math.sin(toRadians(person.legTopRight + person.legBottomRight)) * zoom;
    var realLegBottomRightY = realLegTopRightY + legBottomLength * Math.cos(toRadians(person.legTopRight + person.legBottomRight)) * zoom;

    var realNeckX = realBodyX + neckLength * Math.sin(toRadians(person.body + person.neck)) * zoom;
    var realNeckY = realBodyY + neckLength * Math.cos(toRadians(person.body + person.neck)) * zoom;

    var realHeadX = realBodyX + (neckLength + headRadius) * Math.sin(toRadians(person.body + person.neck)) * zoom;
    var realHeadY = realBodyY + (neckLength + headRadius) * Math.cos(toRadians(person.body + person.neck)) * zoom;

    var topHeadX = realBodyX + (neckLength + headRadius * 2) * Math.sin(toRadians(person.body + person.neck)) * zoom;
    var topHeadY = realBodyY + (neckLength + headRadius * 2) * Math.cos(toRadians(person.body + person.neck)) * zoom;

    realPivotY += getPivotY(0, realBodyY, realArmTopLeftY, realArmBottomLeftY, realArmTopRightY, realArmBottomRightY, realLegTopLeftY, realLegBottomLeftY, realLegTopRightY, realLegBottomRightY, realNeckY, realHeadY - headRadius * zoom) - paddingWidth / 2 * zoom;

    if (person == controller) {
        realController.pivot.x = realPivotX;
        realController.pivot.y = realPivotY;
        realController.body.x = realPivotX + realBodyX;
        realController.body.y = realPivotY - realBodyY;
        realController.armTopLeft.x = realPivotX + realArmTopLeftX;
        realController.armTopLeft.y = realPivotY - realArmTopLeftY;
        realController.armBottomLeft.x = realPivotX + realArmBottomLeftX;
        realController.armBottomLeft.y = realPivotY - realArmBottomLeftY;
        realController.armTopRight.x = realPivotX + realArmTopRightX;
        realController.armTopRight.y = realPivotY - realArmTopRightY;
        realController.armBottomRight.x = realPivotX + realArmBottomRightX;
        realController.armBottomRight.y = realPivotY - realArmBottomRightY;
        realController.legTopLeft.x = realPivotX + realLegTopLeftX;
        realController.legTopLeft.y = realPivotY - realLegTopLeftY;
        realController.legBottomLeft.x = realPivotX + realLegBottomLeftX;
        realController.legBottomLeft.y = realPivotY - realLegBottomLeftY;
        realController.legTopRight.x = realPivotX + realLegTopRightX;
        realController.legTopRight.y = realPivotY - realLegTopRightY;
        realController.legBottomRight.x = realPivotX + realLegBottomRightX;
        realController.legBottomRight.y = realPivotY - realLegBottomRightY;
        realController.neck.x = realPivotX + topHeadX;
        realController.neck.y = realPivotY - topHeadY;
    }

    context.beginPath();
    context.moveTo(realPivotX, realPivotY);
    context.lineTo(realPivotX + realBodyX, realPivotY - realBodyY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX, realPivotY);
    context.lineTo(realPivotX + realLegTopLeftX, realPivotY - realLegTopLeftY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realLegTopLeftX, realPivotY - realLegTopLeftY);
    context.lineTo(realPivotX + realLegBottomLeftX, realPivotY - realLegBottomLeftY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX, realPivotY);
    context.lineTo(realPivotX + realLegTopRightX, realPivotY - realLegTopRightY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realLegTopRightX, realPivotY - realLegTopRightY);
    context.lineTo(realPivotX + realLegBottomRightX, realPivotY - realLegBottomRightY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realBodyX, realPivotY - realBodyY);
    context.lineTo(realPivotX + realArmTopLeftX, realPivotY - realArmTopLeftY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realArmTopLeftX, realPivotY - realArmTopLeftY);
    context.lineTo(realPivotX + realArmBottomLeftX, realPivotY - realArmBottomLeftY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realBodyX, realPivotY - realBodyY);
    context.lineTo(realPivotX + realArmTopRightX, realPivotY - realArmTopRightY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realArmTopRightX, realPivotY - realArmTopRightY);
    context.lineTo(realPivotX + realArmBottomRightX, realPivotY - realArmBottomRightY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.moveTo(realPivotX + realBodyX, realPivotY - realBodyY);
    context.lineTo(realPivotX + realNeckX, realPivotY - realNeckY);
    context.stroke();
    context.closePath();

    context.beginPath();
    context.arc(realPivotX + realHeadX, realPivotY - realHeadY, headRadius * zoom, 0, 2 * Math.PI, false);
    context.stroke();
    context.fill();
    context.closePath();

    if (passableCheck) {
        var imageData = context.getImageData(centerX - wall.width / 2, centerY - wall.height / 2, wall.width, wall.height).data;
        if (person == map) mapImageData = imageData;
        else if (mapImageData != null) {
            passableCheck = false;
            for (var y = 0; y < wall.height; y++) {
                for (var x = 0; x < wall.width; x++) {
                    var index = ((wall.width * y) + x) * 4;
                    var r1 = mapImageData[index];
                    var g1 = mapImageData[index + 1];
                    var b1 = mapImageData[index + 2];
                    var r2 = imageData[index];
                    var g2 = imageData[index + 1];
                    var b2 = imageData[index + 2];
                    if (r1 + g1 + b1 != 765 && r2 + g2 + b2 == 0) {
                        finishing = controller.body < 0 ? 1 : 2;
                        mapImageData = null;
                        return;
                    }
                }
            }
            finishing = 3;
            mapImageData = null;
        }
    }
}

function drawMap(context) {
    var zoom = wall.distance / originalDistance;

    context.fillStyle = '#fff';
    context.strokeStyle = '#fff';
    context.lineWidth = paddingWidth * zoom;
    context.lineCap = 'round';

    context.shadowColor = 0;
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;

    drawPerson(map, zoom, context);
}

function drawController(context) {
    context.fillStyle = '#000';
    context.strokeStyle = '#000';
    context.lineWidth = controllerWidth;
    context.lineCap = 'round';

    drawPerson(controller, 1, context);
}

function drawTime(context) {
    var elapsedTime = (new Date().getTime() - startTime) / 1000;

    if (elapsedTime > timeLimit) {
        elapsedTime = timeLimit;
        if (!finishing) passableCheck = true;
    }

    context.font = "20px Georgia";
    context.fillStyle = '#000';
    var time = (timeLimit - elapsedTime).toFixed(2).toString();
    var timeWidth = context.measureText(time).width;
    context.fillText(time, centerX - timeWidth / 2, centerY - 300);
}

function createRandomPerson(person) {
    person.body = defaultPerson.body + Math.random() * bodyMaxAngle - bodyMaxAngle / 2;
    person.neck = defaultPerson.neck + Math.random() * neckMaxAngle - neckMaxAngle / 2;
    person.armTopLeft = defaultPerson.armTopLeft + Math.random() * armTopMaxAngle - armTopMaxAngle / 2;
    person.armTopRight = defaultPerson.armTopRight + Math.random() * armTopMaxAngle - armTopMaxAngle / 2;
    person.armBottomLeft = defaultPerson.armBottomLeft + Math.random() * armBottomMaxAngle - armBottomMaxAngle / 2;
    person.armBottomRight = defaultPerson.armBottomRight + Math.random() * armBottomMaxAngle - armBottomMaxAngle / 2;
    person.legTopLeft = defaultPerson.legTopLeft + Math.random() * legTopMaxAngle - legTopMaxAngle / 2;
    person.legTopRight = defaultPerson.legTopRight + Math.random() * legTopMaxAngle - legTopMaxAngle / 2;
    person.legBottomLeft = defaultPerson.legBottomLeft + Math.random() * legBottomMaxAngle - legBottomMaxAngle / 2;
    person.legBottomRight = defaultPerson.legBottomRight + Math.random() * legBottomMaxAngle - legBottomMaxAngle / 2;
}

function createMap() {
    createRandomPerson(map);
    controller = clone(defaultPerson);
    finishing = 0;
    wall.distance = defaultDistance;
    startTime = new Date().getTime();
}

function transition(dst) {
    controller.pivot.y = controller.pivot.y * (1 - transitionWeight) + dst.pivot.y * transitionWeight;
    for (var object in controller) {
        if (object == 'pivot') continue;
        controller[object] = controller[object] * (1 - transitionWeight) + dst[object] * transitionWeight;
    }
}

function animate(wall, canvas, context, startTime) {
    if (finishing) {
        if (wall.distance > defaultDistance) wall.distance /= 1.1;
    }
    else {
        if (wall.distance < originalDistance) wall.distance *= 1.005;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (finishing) {
        if (finishing == 1) transition(dead1Controller);
        else if (finishing == 2) transition(dead2Controller);
        else if (finishing == 3) transition(winController);
    }
    drawRail(context);
    drawWall(context);
    drawTime(context);

    requestAnimFrame(function () {
        animate(wall, canvas, context, startTime);
    });
}

var pressed = null;
window.addEventListener('load', function () {
    document.getElementById("myCanvas").addEventListener("mousedown", function (e) {
        if (finishing) {
            createMap();
            return;
        } else {
            var touch = {x: e.x, y: e.y};
            var minDistance = 0x7fffffff;
            for (var object in realController) {
                if (object == 'pivot') continue;
                if (isBetweenSegment(realController[object], realController[getOtherVertex(object)], touch)) {
                    var distance = getDistanceBetweenLineAndPoint(realController[object], realController[getOtherVertex(object)], touch);
                    if (minDistance > distance) {
                        minDistance = distance;
                        pressed = object;
                    }
                }
            }
            if (pressed != 'neck' && minDistance > controllerWidth) pressed = null;
        }
    }, false);

    document.getElementById("myCanvas").addEventListener("mousemove", function (e) {
        if (finishing) return;
        if (!pressed) return;
        var vertex = pressed, parentAngle = 0;
        var first = true, firstVertex;
        do {
            vertex = getOtherVertex(vertex);
            if (first) {
                first = false;
                firstVertex = realController[vertex];
            }
            parentAngle += vertex == 'pivot' ? 0 : controller[vertex];
        } while (vertex != 'pivot');
        controller[pressed] = getAngle(firstVertex, {x: e.x, y: e.y}) - parentAngle;

    }, false);

    document.getElementById("myCanvas").addEventListener("mouseup", function (e) {
        pressed = null;
    }, false);
});

//    createMap();
var wallImage = new Image();
wallImage.onload = function () {
    setTimeout(function () {
        var startTime = (new Date()).getTime();
        animate(wall, canvas, context, startTime);
    }, 0);
};
wallImage.src = './image/wall.jpg';