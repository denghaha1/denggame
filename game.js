const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCount = canvas.width / gridSize;

let snake = {
    body: [{x: 10, y: 10}],
    dx: 0,
    dy: 0,
    nextDx: 0,
    nextDy: 0
};

let food = {
    x: 15,
    y: 15
};

let score = 0;
let gameSpeed = 200;
let gameLoop;
let gameRunning = false;
let isFirstGame = true;

// 食物图片加载
let foodImg = new Image();
foodImg.src = 'sun.png';

// 添加加载成功的处理
foodImg.onload = function() {
    console.log('食物图片加载成功');
};

// 添加错误处理
foodImg.onerror = function() {
    console.error('食物图片加载失败，请检查图片路径是否正确：' + foodImg.src);
    foodImg = null;
};

// 蛇身图片加载
let snakeImg = new Image();
snakeImg.src = './wang.jpg';

snakeImg.onload = function() {
    console.log('蛇身图片加载成功：', snakeImg.src);
};

snakeImg.onerror = function(e) {
    console.error('蛇身图片加载失败：', e);
    console.error('图片路径：', snakeImg.src);
    snakeImg = null;
};

// 在文件顶部添加相关的代码
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.blinkSpeed = Math.random() * 0.02 + 0.005;
        this.brightness = Math.random();
        this.maxBrightness = Math.random() * 0.5 + 0.5;
        this.increasing = true;
    }

    update() {
        if (this.increasing) {
            this.brightness += this.blinkSpeed;
            if (this.brightness >= this.maxBrightness) {
                this.increasing = false;
            }
        } else {
            this.brightness -= this.blinkSpeed;
            if (this.brightness <= 0.1) {
                this.increasing = true;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 创建星星数组（增加星星数量）
const stars = Array(100).fill(null).map(() => new Star());

// 在文件顶部添加相关的代码
class Meteor {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = 0;
        this.size = Math.random() * 3 + 2;  // 增加流星大小
        this.speed = Math.random() * 8 + 5;  // 增加流星速度
        this.angle = Math.PI / 4 + (Math.random() * Math.PI / 6);
        this.tailLength = Math.random() * 30 + 20;  // 增加尾巴长度
        this.brightness = Math.random() * 0.3 + 0.7;  // 增加亮度
    }

    update() {
        // 根据角度和速度更新位置
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // 如果流星离开画布，重置位置
        if (this.y > canvas.height || this.x > canvas.width) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.beginPath();
        
        // 创建流星的渐变效果
        const gradient = ctx.createLinearGradient(
            this.x, this.y,
            this.x - Math.cos(this.angle) * this.tailLength,
            this.y - Math.sin(this.angle) * this.tailLength
        );
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.brightness})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.size;
        ctx.lineCap = 'round';
        
        // 绘制流星轨迹
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - Math.cos(this.angle) * this.tailLength,
            this.y - Math.sin(this.angle) * this.tailLength
        );
        
        ctx.stroke();
        ctx.restore();
    }
}

// 创建流星数组
const meteors = Array(20).fill(null).map(() => new Meteor());

// 在文件顶部添加背景音乐相关代码
let bgMusic = new Audio('gequ.mp3');
bgMusic.loop = true;  // 设置循环播放

// 初始化游戏
function startGame() {
    // 隐藏开始按钮
    document.getElementById('startButton').style.display = 'none';
    
    // 开始播放背景音乐
    bgMusic.play().catch(error => {
        console.error('背景音乐播放失败：', error);
    });
    
    snake = {
        body: [{x: 10, y: 10}],
        dx: 0,
        dy: 0,
        nextDx: 1, // 设置初始方向向右
        nextDy: 0
    };
    score = 0;
    gameSpeed = 200;
    document.getElementById('score').textContent = score;
    document.getElementById('gameOver').classList.add('hidden');
    generateFood();
    
    if (!gameRunning) {
        gameRunning = true;
        gameLoop = setInterval(update, gameSpeed);
    }
    
    // 如果是第一次游戏，绘制初始状态
    if (isFirstGame) {
        draw();
        isFirstGame = false;
    }
}

// 生成食物
function generateFood() {
    food.x = Math.floor(Math.random() * (tileCount - 2));
    food.y = Math.floor(Math.random() * (tileCount - 2));
    
    // 确保食物不会生成在蛇身上
    for (let part of snake.body) {
        if (part.x === food.x && part.y === food.y) {
            generateFood();
            break;
        }
    }
}

// 更新游戏状态
function update() {
    // 更新蛇的方向
    snake.dx = snake.nextDx;
    snake.dy = snake.nextDy;
    
    // 移动蛇
    const head = {x: snake.body[0].x + snake.dx, y: snake.body[0].y + snake.dy};
    
    // 立即检查碰撞
    if (checkCollision(head)) {
        gameOver();
        return;
    }
    
    // 先将新的头部添加到蛇身
    snake.body.unshift(head);
    
    // 检查是否吃到食物（考虑两格大小的碰撞）
    const headRight = head.x + 1;
    const headBottom = head.y + 1;
    const foodRight = food.x + 1;
    const foodBottom = food.y + 1;
    
    // 使用重叠检测
    const ateFood = !(head.x > foodRight || 
                     headRight < food.x || 
                     head.y > foodBottom || 
                     headBottom < food.y);
    
    // 如果没有吃到食物，移除尾部（保持长度）
    if (!ateFood) {
        snake.body.pop();
    } else {
        // 如果吃到食物，保留当前长度（因为已经添加了头部，相当于增长一格）
        score += 10;
        document.getElementById('score').textContent = score;
        generateFood();
        if (gameSpeed > 100) {
            gameSpeed -= 2;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, gameSpeed);
        }
    }
    
    draw();
}

// 检查碰撞
function checkCollision(head) {
    // 检查墙壁碰撞（考虑蛇头的大小为2格）
    const headRight = head.x + 1;  // 蛇头右边界
    const headBottom = head.y + 1;  // 蛇头下边界
    
    // 一旦碰到任何边界就立即返回true
    if (head.x < 0 ||             // 左边界
        headRight >= tileCount ||  // 右边界
        head.y < 0 ||             // 上边界
        headBottom >= tileCount) { // 下边界
        return true;
    }
    
    // 检查自身碰撞（只检查与其他身体部分的重叠）
    for (let i = 4; i < snake.body.length; i++) {
        const part = snake.body[i];
        if (head.x === part.x && head.y === part.y) {
            return true;
        }
    }
    
    return false;
}

// 添加绘制爱心的函数
function drawHeart(ctx, x, y, size) {
    ctx.save();
    
    // 绘制爱心路径
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    
    // 绘制左半边的爱心曲线
    ctx.bezierCurveTo(
        x, y, 
        x - size / 2, y, 
        x - size / 2, y + size / 4
    );
    ctx.bezierCurveTo(
        x - size / 2, y + size / 2, 
        x, y + size * 3/4, 
        x, y + size
    );
    
    // 绘制右半边的爱心曲线
    ctx.bezierCurveTo(
        x, y + size * 3/4, 
        x + size / 2, y + size / 2, 
        x + size / 2, y + size / 4
    );
    ctx.bezierCurveTo(
        x + size / 2, y, 
        x, y, 
        x, y + size / 4
    );
    
    // 将爱心路径设置为裁剪区域
    ctx.clip();
    
    // 添加图片加载状态检查和调试信息
    if (snakeImg && snakeImg.complete) {
        console.log('正在绘制蛇身图片');
        try {
            ctx.drawImage(snakeImg,
                x - size/2,  // 片左上角x坐标
                y,           // 图片左上角y坐标
                size,        // 图片宽度
                size         // 图片高度
            );
        } catch (error) {
            console.error('绘制图片时出错：', error);
            // 如果绘制失败，使用备用颜色
            ctx.fillStyle = '#FF69B4';
            ctx.fill();
        }
    } else {
        console.log('使用备用颜色绘制');
        ctx.fillStyle = '#FF69B4';
        ctx.fill();
    }
    
    // 添加爱心边框
    ctx.strokeStyle = '#FF69B4';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

// 修改 draw 函数中绘制蛇的部分
function draw() {
    // 使用深色背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';  // 调整透明度使拖尾效果更明显
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制星星
    stars.forEach(star => {
        star.update();
        star.draw(ctx);
    });
    
    // 更新和绘制所有流星
    meteors.forEach(meteor => {
        meteor.update();
        meteor.draw(ctx);
    });
    
    // 绘制蛇
    for (let part of snake.body) {
        const centerX = part.x * gridSize + gridSize;
        const centerY = part.y * gridSize + gridSize;
        drawHeart(ctx, centerX, centerY, gridSize * 2);
    }
    
    // 绘制食物（确保在碰撞检测后才绘制）
    const head = snake.body[0];
    const headRight = head.x + 1;
    const headBottom = head.y + 1;
    const foodRight = food.x + 1;
    const foodBottom = food.y + 1;
    
    // 只有当蛇头没有与食物重叠时才绘制食物
    const isOverlapping = !(head.x > foodRight || 
                          headRight < food.x || 
                          head.y > foodBottom || 
                          headBottom < food.y);
                          
    if (!isOverlapping && foodImg && foodImg.complete) {
        const foodSize = gridSize * 2;
        ctx.drawImage(foodImg, 
            food.x * gridSize,
            food.y * gridSize,
            foodSize,
            foodSize
        );
    }
}

// 游戏结束
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // 停止背景音乐
    bgMusic.pause();
    bgMusic.currentTime = 0;  // 重置音乐播放位置
    
    const finalScore = score;
    const highScore = localStorage.getItem('highScore') || 0;
    if (finalScore > highScore) {
        localStorage.setItem('highScore', finalScore);
        document.getElementById('highScore').textContent = finalScore;
    }
    document.getElementById('finalScore').textContent = finalScore;
    document.getElementById('gameOver').classList.remove('hidden');
    // 显示开始按钮
    document.getElementById('startButton').style.display = 'block';
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 添加回车键开始游戏的处理
    if (e.key === 'Enter') {
        if (!gameRunning) {
            startGame();
        }
        return;
    }

    // 原有的方向键控制
    switch(e.key) {
        case 'ArrowUp':
            if (snake.dy !== 1) {
                snake.nextDx = 0;
                snake.nextDy = -1;
            }
            break;
        case 'ArrowDown':
            if (snake.dy !== -1) {
                snake.nextDx = 0;
                snake.nextDy = 1;
            }
            break;
        case 'ArrowLeft':
            if (snake.dx !== 1) {
                snake.nextDx = -1;
                snake.nextDy = 0;
            }
            break;
        case 'ArrowRight':
            if (snake.dx !== -1) {
                snake.nextDx = 1;
                snake.nextDy = 0;
            }
            break;
    }
});

// 初始化最高分
document.getElementById('highScore').textContent = localStorage.getItem('highScore') || 0;

// 初始绘制空白游戏板
draw();