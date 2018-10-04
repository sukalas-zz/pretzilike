let main = (function () {
    let timeStarted;
    this.board = document.createElement('div');
    this.board.className = 'board';
    this.board.style.left = 0 + 'px';
    this.board.style.top = 0 + 'px';
    this.gap = 200;
    this.c = document.createElement('canvas');
    this.ctx = c.getContext('2d');
    let moves = false;
    let clickAvail = true;
    let once = false;
    let isInside = true;
    let zoom = 1;
    const RULES = {
        draggable: false,
        clickable: true,
        zoomable: true
    }
    const prev = {
        x: 0,
        y: 0,
        left: 0,
        right: 0
    }
    const initial = {
        x: 0,
        y: 0
    }
    const target = {
        x: 0,
        y: 0
    }


    let init = () => {
        this.c.width = 3000;
        this.c.height = 3000;
        this.ctx = this.c.getContext('2d');
        draw(this.ctx);
        document.body.appendChild(this.board);
        this.board.appendChild(this.c);
        bindEventListeners();
    }

    let draw = () => {
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
        this.ctx.fillStyle = "black";

        let grid = function (gap) {
            for (let x = 0; x < this.c.width / gap; x++) {
                for (let y = 0; y < this.c.height / gap; y++) {
                    makeLabel(x, y)
                    makeLine(x, y);
                }
            }
        }


        grid(this.gap);

        function makeLine(x, y) {
            const margin = 20;
            let line_svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            line_svg.style.position = 'absolute';
            line_svg.style.width = this.gap - margin + 'px';
            line_svg.style.height = this.gap - margin + 'px';
            line_svg.style.left = x * this.gap + margin / 2 + 'px';
            line_svg.style.top = y * this.gap + margin / 2 + 'px';
            line_svg.innerHTML = `<rect x="0" y="0" width="${this.gap - margin}" height="${this.gap-margin}" stroke="rgb(163, 26, 37)" fill="black" stroke-width="2"/>`;

            this.board.appendChild(line_svg);
        }

        function makeLabel(x, y) {
            const margin = 20;
            const l = document.createElement('div');
            // const classToggle = Math.random() > 0.99 ? 'label active' : 'label';
            l.className = 'label';
            l.style.width = this.gap - margin + 'px';
            l.style.height = this.gap - margin + 'px';
            l.style.left = x * this.gap + margin / 2 + 'px';
            l.style.top = y * this.gap + margin / 2 + 'px';
            l.innerHTML = String.fromCharCode(2600 + Math.random() * 100);
            l.style.lineHeight = l.style.width;
            this.board.appendChild(l);
        }
    }

    let bindEventListeners = () => {
        document.body.addEventListener('mousedown', (e) => mouseDown(e))
        document.body.addEventListener('mouseup', (e) => mouseUp(e))
        document.body.addEventListener('mousemove', (e) => mouseMoving(e))
        document.body.addEventListener('click', (e) => mouseClicked(e))
        document.body.addEventListener('wheel', (e) => mouseScrolls(e))
    }

    let mouseDown = (e) => {
        console.log('Mouse down', RULES);
        timeStarted = JSON.stringify(new Date().getTime());
        initial.x = e.clientX - prev.x;
        initial.y = e.clientY - prev.y;
        RULES.draggable = true;
    }

    let mouseUp = (e) => {
        console.log('Mouse up', RULES);
        const timeNow = JSON.stringify(new Date().getTime());
        const timeDiff = (parseInt(timeNow) - parseInt(timeStarted)) / 1000;
        if(timeDiff < 0.1) {
            RULES.draggable = false;
            RULES.clickable = true;
        } else {
            RULES.draggable = true;
        }
    }

    let mouseMoving = (e) => {
        if (RULES.draggable) {
            RULES.clickable = false;
            if (!once) {
                initial.x = e.clientX;
                initial.y = e.clientY;
                once = true;
            }
            console.log('dragging board', RULES)

            target.x = e.clientX - initial.x;
            target.y = e.clientY - initial.y;

            dl = target.x + 'px';
            dt = target.y + 'px';

            TweenLite.to(this.board.style, .01, { top: dt, left: dl, ease:Linear.EaseOut });

            prev.x = target.x;
            prev.y = target.y;
        }
    }

    let mouseScrolls = (e) => {
        RULES.zoomable = true;
        RULES.draggable = false;

        zoom += e.wheelDelta > 0 ? 0.025 : -0.025;
        if (zoom < 0.5) {
            return;
        }
        let percX = (window.innerWidth * e.pageX) / (18.3 * window.innerWidth);
        let percY = (window.innerHeight * e.pageY) / (9.3 * window.innerHeight);
        document.body.transformOrigin = `${percX}% ${percY}%`;
        document.body.style.transform = `scale(${zoom})`;
    }

    let mouseClicked = (e) => {
        console.log('clicked', RULES)
        RULES.draggable = false;
        const onlyLabels = e.target.classList.contains('label');
        if (!moves && RULES.clickable && onlyLabels) {
            let labels = document.getElementsByClassName('active');
            Object.values(labels).map((el) => el.className = 'label');
            if (e.target.classList.contains('active')) {
                e.target.classList.remove('active');
            } else {
                e.target.classList.add('active');
            }
            centerBoard(e);
        }
    }

    let centerBoard = function (e) {
        console.log('centering board')
        let offset = e.target.getBoundingClientRect();
        let correctionTop = extractNum(this.board.style.top) - offset.top;
        let correctionLeft = extractNum(this.board.style.left) - offset.left;
        animateMove(correctionTop, correctionLeft);
    }

    let animateMove = function (t, l) {
        dt = t + window.innerHeight / 2 - this.gap / 2 + 'px';
        dl = l + window.innerWidth / 2 - this.gap / 2 + 'px';
        TweenLite.to(this.board.style, .6, {
            top: dt,
            left: dl,
            ease: Power2.EaseInOut,
            onComplete: () => {
                RULES.clickable = true;
            }
        })
    }

    let isInsideBoard = (left, top) => {
        const lRule = (left <= 0);
        const rRule = (left * -1 + window.innerWidth) < this.c.width;
        const tRule = (top <= 0);
        const bRule = (top * -1 + window.innerHeight) < this.c.height;
        // const border = !lRule ? 'borderLeft' : !rRule ? 'borderRight' ? !tRule : 'borderTop' : 'borderBottom';
        // this.board.style[border] = '5px solid red';
        const inState = lRule && rRule && tRule && bRule;
        return inState;
    }

    let extractNum = (el) => {
        return parseInt(el.replace('px', ''));
    }


    return {
        init: init
    }
})()