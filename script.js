

// Boid class
class Boid {
    constructor(x, y, ctx, colour) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        if (Math.random() < 0.5) {
            this.img = img;
        } else {
            this.img = img2;
        }
        this.velocity = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
        }
        this.size = 5;
        this.speed = 2.5;

    }

    update(boids) {
        let separationForce = this.separation(boids);
        let alignmentForce = this.alignment(boids);
        let cohesionForce = this.cohesion(boids);
        let avoidMouseForce = this.avoidMouse();
        let avoidBarrierForce = this.avoidBarrier();
        let avoidWallsForce = this.avoidWalls();


        this.velocity.x += separationForce.x + alignmentForce.x + cohesionForce.x + avoidMouseForce.x + avoidBarrierForce.x + avoidWallsForce.x + Math.random() * 0.2 - 0.1;
        this.velocity.y += separationForce.y + alignmentForce.y + cohesionForce.y + avoidMouseForce.y + avoidBarrierForce.y + avoidWallsForce.y + Math.random() * 0.2 - 0.1;

        let speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y)
        if (speed > maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * maxSpeed;
        }

        this.x += this.velocity.x * this.speed;
        this.y += this.velocity.y * this.speed;

        
        if (!avoidWalls) {
            if (this.x > this.ctx.canvas.width + buffer) this.x = -buffer;
            if (this.x < -buffer) this.x = this.ctx.canvas.width + buffer;
            if (this.y > this.ctx.canvas.height + buffer) this.y = -buffer;
            if (this.y < -buffer) this.y = this.ctx.canvas.height + buffer;
        }  
    }

    avoidBarrier() {
        let sum = { x: 0, y: 0 };
        let count = 0

        for (let barrier of barriers) {
            let d = Math.sqrt(Math.pow(this.x - barrier.x, 2) + Math.pow(this.y - barrier.y, 2));
            if (d < barrierRadius) {
                let diffX = this.x - barrier.x;
                let diffY = this.y - barrier.y;
                sum.x += diffX / d;
                sum.y += diffY / d;
                count++;
            }
        }

        if (count > 0) {
            sum.x /= count;
            sum.y /= count;

            let magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
            sum.x = (sum.x / magnitude) * maxSpeed - this.velocity.x;
            sum.y = (sum.y / magnitude) * maxSpeed - this.velocity.y;
            sum.x = Math.max(-maxForce * 3, Math.min(maxForce * 3, sum.x));
            sum.y = Math.max(-maxForce * 3, Math.min(maxForce * 3, sum.y));
        }

        return sum;
    }

    avoidMouse() {

        let sum = { x: 0, y: 0};

        if (avoidMouse == false) return sum;

        let d = Math.sqrt(Math.pow(this.x - mouse_location.x, 2) + Math.pow(this.y - mouse_location.y, 2))
        let diffX = this.x - mouse_location.x;
        let diffY = this.y - mouse_location.y;

        if (d < barrierRadius) {
            sum.x += diffX / d;
            sum.y += diffY / d;
        }
        

        if (sum.x != 0 && sum.y != 0) {
            let magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
            sum.x = (sum.x / magnitude) * maxSpeed - this.velocity.x;
            sum.y = (sum.y / magnitude) * maxSpeed - this.velocity.y;
            sum.x = Math.max(-maxForce * 2, Math.min(maxForce * 2, sum.x));
            sum.y = Math.max(-maxForce * 2, Math.min(maxForce * 2, sum.y));
        }
    
        return sum;
    }

    avoidWalls() {
        let sum = { x: 0, y: 0 };
        
        if (!avoidWalls) return sum;

        const wallForce = 0.1; // Adjust this force as needed
        
        if (this.x < wallRadius) {
            sum.x = wallForce;
        } else if (this.x > this.ctx.canvas.width - wallRadius) {
            sum.x = -wallForce;
        }
        
        if (this.y < wallRadius) {
            sum.y = wallForce;
        } else if (this.y > this.ctx.canvas.height - wallRadius) {
            sum.y = -wallForce;
        }
        
        return sum;
    }
    
    

    checkSight(other, radius) {
        let d = 0;
    
        if (this.x != other.x && this.y != other.y) {
            d = Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    
            if (d > 0 && d < radius) {
                let diffX = this.x - other.x;
                let diffY = this.y - other.y;
    
                let angleToOther = Math.atan2(diffY, diffX);
                let directionAngle = Math.atan2(this.velocity.y, this.velocity.x);
    
                // Normalize angles to be between 0 and 2*PI
                angleToOther = (angleToOther + (2 * Math.PI)) % (2 * Math.PI);
                directionAngle = (directionAngle + (2 * Math.PI)) % (2 * Math.PI);
    
                // Calculate the difference between the angles
                let angleDifference = Math.abs(directionAngle - angleToOther);
    
                // Normalize the angleDifference to be between 0 and PI
                if (angleDifference > Math.PI) {
                    angleDifference = (2 * Math.PI) - angleDifference;
                }
    

                
    
                if (angleDifference < rearViewLimit) {
                    return { canSee: true, d: d };
                }
            }
        }
    
        return { canSee: false, d: d };
    }

    separation(boids) {
        let sum = { x: 0, y: 0};
        let count = 0;

        for (let other of boids) {

            const { canSee, d } = this.checkSight(other, desiredSeperation);

            if (canSee) {
                let diffX = this.x - other.x;
                let diffY = this.y - other.y;
                sum.x += diffX / d;
                sum.y += diffY / d;
                count++;
            }
        }

        let maxForceMulti = 1

        if (count > 0) {
            sum.x /= count;
            sum.y /= count;

            let magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
            sum.x = (sum.x / magnitude) * maxSpeed - this.velocity.x;
            sum.y = (sum.y / magnitude) * maxSpeed - this.velocity.y;
            sum.x = Math.max(-maxForce * maxForceMulti, Math.min(maxForce* maxForceMulti, sum.x));
            sum.y = Math.max(-maxForce* maxForceMulti, Math.min(maxForce* maxForceMulti, sum.y));
        }
        
        return sum;
    }

    alignment(boids) {
        let sum = { x: 0, y: 0};
        let count = 0;

        for (let other of boids) {
            const { canSee, d } = this.checkSight(other, boidRadius);
  
            if (canSee) {
                sum.x += other.velocity.x;
                sum.y += other.velocity.y;
                count++;
            }

        }

        let maxForceMulti = 1
        if (count > 0) {
            sum.x /= count;
            sum.y /= count;

            let magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
            sum.x = (sum.x / magnitude) * maxSpeed - this.velocity.x;
            sum.y = (sum.y / magnitude) * maxSpeed - this.velocity.y;
            sum.x = Math.max(-maxForce * maxForceMulti, Math.min(maxForce* maxForceMulti, sum.x));
            sum.y = Math.max(-maxForce* maxForceMulti, Math.min(maxForce* maxForceMulti, sum.y));
        }

        return sum;
    }

    cohesion(boids) {
        let sum = { x: 0, y: 0 };
        let count = 0;

        for (let other of boids) {

            const { canSee, d } = this.checkSight(other);

            if (canSee) {
                sum.x += other.x;
                sum.y += other.y;
                count++;
            }
        }

        let maxForceMulti = 1;

        if (count > 0) {
            sum.x /= count;
            sum.y /= count;

            sum.x -= this.x;
            sum.y -= this.y

            let magnitude = Math.sqrt(sum.x * sum.x + sum.y * sum.y);
            sum.x = (sum.x / magnitude) * maxSpeed - this.velocity.x;
            sum.y = (sum.y / magnitude) * maxSpeed - this.velocity.y;
            sum.x = Math.max(-maxForce * maxForceMulti, Math.min(maxForce * maxForceMulti, sum.x));
            sum.y = Math.max(-maxForce * maxForceMulti, Math.min(maxForce * maxForceMulti, sum.y));
        }

        return sum;
    }

    drawArrow() {
        let angle = Math.atan2(this.velocity.y, this.velocity.x);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + this.size * Math.cos(angle), this.y + this.size * Math.sin(angle));
        this.ctx.lineTo(this.x + this.size * Math.cos(angle - Math.PI * (3 / 4)), this.y + this.size * Math.sin(angle - Math.PI * (3 / 4)));
        this.ctx.lineTo(this.x + this.size * Math.cos(angle + Math.PI * (3 / 4)), this.y + this.size * Math.sin(angle + Math.PI * (3 / 4)));
        this.ctx.fillStyle = this.colour;
        this.ctx.fill();
        this.ctx.closePath();
    }

    drawFish() {

        let angle = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI;
        let ctx = this.ctx;
        // Calculate the new dimensions
        let newWidth = this.img.width / 10;
        let newHeight = this.img.height / 10;
    
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(angle);
        // Draw the image at a tenth of its size and centered on the boid's position
        ctx.drawImage(this.img, -newWidth / 2, -newHeight / 2, newWidth, newHeight);
        ctx.restore();
    }
}

class barrier {
    constructor(x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.size = 10;
    }

    draw() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Draw a circle at (this.x, this.y) with radius this.size
        this.ctx.fillStyle = 'red'; // Set fill color to red
        this.ctx.fill(); // Fill the circle with the current fill color
        this.ctx.closePath();
    }
}

// Main code
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const boids = [];
const barriers = [];

const img = document.getElementById("fishImg");
const img2 = document.getElementById("fishImg2");

// Set canvas dimensions based on window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;



let boidRadius = 45;
let barrierRadius = 80;
let maxSpeed = 2.6;
let maxForce = 0.05;
let desiredSeperation = 20;
let avoidMouse = false;
let avoidWalls = false;

let buffer = 5;
let wallRadius = 120;

let exclusionZone = 10 * (Math.PI / 180); // X degrees in radians
let rearViewLimit = Math.PI - exclusionZone; // Subtract from PI to exclude the rear zone

let mouse_location = { x: 0, y: 0};

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

canvas.addEventListener("click", function(event) {
    let x = event.clientX - canvas.offsetLeft;
    let y = event.clientY - canvas.offsetTop;
    const r = Math.floor(Math.random() * 150); // Random value for red (0-255)
    const g = Math.floor(Math.random() * 150); // Random value for green (0-255)
    const b = Math.floor(Math.random() * 150);
    const rgb = `rgb(${r}, ${g}, ${b})`

    for (let i = 0; i < 2; i++) {
        boids.push(new Boid(x + 20, y, ctx, rgb));   
        boids.push(new Boid(x - 20, y, ctx, rgb));   
        boids.push(new Boid(x, y + 20, ctx, rgb));   
        boids.push(new Boid(x, y - 20, ctx, rgb));   
    }
});

canvas.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the default context menu from appearing

    let x = event.clientX - canvas.offsetLeft;
    let y = event.clientY - canvas.offsetTop;

    barriers.push(new barrier(x, y, ctx));
});

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a linear gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    // Set the gradient colors
    gradient.addColorStop(0, '#00c2c7'); // Dark blue at the top
    gradient.addColorStop(1, '#97ebdb'); // Light blue at the bottom

    // Fill the canvas with the gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let barrier of barriers) {
        barrier.draw();
    }

    for (let boid of boids) {
        boid.update(boids);
        boid.drawFish();
    }

}

animate();

const boidRadiusSlider = document.getElementById('boidRadius');
const barrierRadiusSlider = document.getElementById("barrierRadius");
const maxSpeedSlider = document.getElementById('maxSpeed');
const maxForceSlider = document.getElementById('maxForce');
const desiredSeperationSlider = document.getElementById('desiredSeperation');
const avoidMouseCheckbox = document.getElementById("avoidMouse");
const avoidWallsCheckbox = document.getElementById("avoidWalls");

const boidRadiusValue = document.getElementById('boidRadiusValue');
const barrierRadiusValue = document.getElementById('barrierRadiusValue');
const maxSpeedValue = document.getElementById('maxSpeedValue');
const maxForceValue = document.getElementById('maxForceValue');
const desiredSeperationValue = document.getElementById('desiredSeperationValue');



// Add event listeners to sliders
boidRadiusSlider.addEventListener('input', updateValues);
barrierRadiusSlider.addEventListener('input', updateValues);
maxSpeedSlider.addEventListener('input', updateValues);
maxForceSlider.addEventListener('input', updateValues);
desiredSeperationSlider.addEventListener('input', updateValues);
avoidMouseCheckbox.addEventListener('change', updateValues);
avoidWallsCheckbox.addEventListener('change', updateValues);

canvas.addEventListener('mousemove', function(event) {
    mouse_location.x = event.clientX - canvas.offsetLeft;
    mouse_location.y = event.clientY - canvas.offsetTop;
});




// Function to update values based on slider changes
function updateValues() {
    // Get current values from sliders
    boidRadius = parseFloat(boidRadiusSlider.value);
    barrierRadius = parseFloat(barrierRadiusSlider.value)
    maxSpeed = parseFloat(maxSpeedSlider.value);
    maxForce = parseFloat(maxForceSlider.value);
    desiredSeperation = parseFloat(desiredSeperationSlider.value);
    avoidMouse = avoidMouseCheckbox.checked;
    avoidWalls = avoidWallsCheckbox.checked;

    boidRadiusValue.textContent = boidRadiusSlider.value;
    barrierRadiusValue.textContent = barrierRadiusSlider.value;
    maxSpeedValue.textContent = maxSpeedSlider.value;
    maxForceValue.textContent = maxForceSlider.value;
    desiredSeperationValue.textContent = desiredSeperationSlider.value;

}