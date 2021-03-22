// Vanilla JS dom ready
function ready(fn) {
    if (document.readyState === "complete" || document.readyState !== "loading") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

ready(function () {

    /*
        Christmas light by Nik from https://codepen.io/nikrowell/pen/xmKjya
    */

    const colors = [
        '#FF8C00', '#D98E48', '#EBBF83', '#9932CC', '#6495ED', '#FFFFFF'
    ];

    const TWO_PI = Math.PI * 2;

    function lerp(value, min, max) {
        return min + value * (max - min);
    }

    function normalize(value, min, max) {
        return (value - min) / (max - min);
    }

    function fill(size, fn) {
        return [...Array(size)].map((undef, i) => fn(i));
    }

    function random(min?: any, max?: number) {
        if (arguments.length === 0) {
            return Math.random();
        }
        if (Array.isArray(min)) {
            return min[Math.floor(Math.random() * min.length)];
        }
        if (min === undefined) {
            min = 1;
        }
        if (max == undefined) {
            max = min || 1;
            min = 0;
        }
        return min + Math.random() * (max - min);
    }


    function toRGB(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    }

    class Light {
        graphics: CanvasRenderingContext2D;
        position: any;
        radius: number;
        color: string;
        alpha: number;
        softness: number;
        twinkle: any;

        constructor({
                        position = {x: 0, y: 0},
                        radius = 0,
                        color = '#FFFFFF',
                        alpha = 0.5,
                        softness = 0.1,
                    } = {}) {

            this.graphics = document.createElement('canvas').getContext('2d');
            this.position = position;
            this.radius = radius;
            this.color = color;
            this.alpha = alpha;
            this.softness = softness;

            this.twinkle = random() > 0.7 ? false : {
                phase: random(TWO_PI),
                speed: random(0.0001, 0.001),
                alpha: 0
            };

            this.render();
        }

        get canvas() {
            return this.graphics.canvas;
        }

        render() {

            const {graphics, radius, color, alpha, softness} = this;
            const [r, g, b] = toRGB(color);
            const gradient = graphics.createRadialGradient(0, 0, radius, 0, 0, 0);

            gradient.addColorStop(0, `rgba(${r},${g},${b},0)`);
            gradient.addColorStop(softness, `rgba(${r},${g},${b},${alpha})`);
            gradient.addColorStop(1, `rgba(${r},${g},${b},${alpha})`);

            this.canvas.width = radius * 2.1;
            this.canvas.height = radius * 2.1;

            graphics.translate(radius, radius);
            graphics.beginPath();
            graphics.arc(0, 0, radius, 0, TWO_PI);
            graphics.fillStyle = gradient;
            graphics.fill();
        }

        update(time) {

            if (!this.twinkle) return;

            const {phase, speed} = this.twinkle;
            const theta = phase + time * speed;
            const value = normalize(Math.sin(theta), -1, 1);

            this.twinkle.alpha = lerp(value, 0.1, 1);
        }

        draw(context) {

            context.save();
            context.translate(this.position.x, this.position.y);

            if (this.twinkle) {
                const {scale, alpha} = this.twinkle;
                context.scale(scale, scale);
                context.globalAlpha = alpha;
            }

            context.drawImage(this.canvas, -this.radius, -this.radius);
            context.restore();
        }
    }

    class Background {
        baseColor: string;
        graphics: CanvasRenderingContext2D;

        constructor({baseColor = '#0C0000'} = {}) {
            this.baseColor = baseColor;
            this.graphics = document.createElement('canvas').getContext('2d');
            this.render();
        }

        get canvas() {
            return this.graphics.canvas;
        }

        render() {

            const width = window.innerWidth;
            const height = window.innerHeight;
            const centerY = height / 2;
            const count = Math.floor(0.05 * width);
            const context = this.graphics;

            context.canvas.width = width;
            context.canvas.height = height;
            context.globalCompositeOperation = 'lighter';
            context.beginPath();
            context.fillStyle = this.baseColor;
            context.fillRect(0, 0, width, height);

            for (let i = 0; i < count; i++) {

                const light = new Light({
                    radius: random(200, 250),
                    alpha: random(0.01, 0.05),
                    color: random(colors),
                    softness: random(0.25, 0.9)
                });

                context.drawImage(
                    light.canvas,
                    random(width) - light.radius,
                    centerY - light.radius + random(-200, 200)
                );
            }
        }

        draw(context) {
            context.drawImage(this.canvas, 0, 0);
        }
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    document.body.appendChild(canvas);

    const background = new Background();

    let lights = [];

    function draw(time) {

        const {width, height} = canvas;

        context.save();
        context.clearRect(0, 0, width, height);
        context.globalCompositeOperation = 'lighter';

        background.draw(context);

        lights.forEach(light => {
            light.update(time);
            light.draw(context);
        });

        context.restore();
        requestAnimationFrame(draw);
    }

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function reset() {

        const {width, height} = canvas;
        const count = Math.floor(width * 0.02);
        const theta = random(TWO_PI);
        const amplitude = height * 0.08;
        const cx = width / 2;
        const cy = height / 2;

        lights = fill(count, i => {

            const percent = (i / count);
            const x = percent * width;
            const distanceToCenter = 1 - Math.abs(cx - x) / cx;
            const varianceRange = lerp(distanceToCenter, 50, 200);
            const variance = random(-varianceRange, varianceRange);
            const offset = Math.sin(theta + percent * TWO_PI) * amplitude + variance;
            const y = cy + offset;

            return new Light({
                position: {x, y},
                radius: random(100, Math.max(1, 80 * distanceToCenter)),
                color: random(colors),
                alpha: random(0.1, 0.5),
                softness: random(0.1, 0.5)
            });
        });
    }

    function init() {
        resize();
        reset();
        requestAnimationFrame(draw);
    }

    init();
});