const element = document.getElementById('element');
const grid = document.getElementById('grid');
const free = document.getElementById('free');
const error = document.getElementById('error');
let draggableElement = {};

if (!element || !grid || !free || !error) {
    document.body.innerHTML = 'Internal error, please contact with developers';
    throw new Error('Internal error, please contact with developers');
}

function getRandomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function getTargetZone(clientX, clientY) {
    const isPointerInZone = (coords) => {
        return clientX >= coords.left && clientX <= coords.right && clientY >= coords.top && clientY <= coords.bottom;
    };
    if (isPointerInZone(grid.getBoundingClientRect())) {
        return grid;
    }
    if (isPointerInZone(free.getBoundingClientRect())) {
        return free;
    }

    return null;
}

function enterZone(zone) {
    if (!zone) {
        return;
    }
    try {
        zone.classList.add(`${zone.id}_target`);
    } catch (e) {
        error.innerHTML = 'Internal error, please contact with developers';
    }
}

function leaveZone(zone) {
    if (!zone) {
        return;
    }
    zone.classList.remove(`${zone.id}_target`);
}

function toggleGridScroll() {
    try {
        if (grid.scrollHeight > grid.clientHeight) {
            grid.classList.add('grid_scroll');
        } else {
            grid.classList.remove('grid_scroll');
        }
    } catch (e) {
        error.innerHTML = 'Internal error, please contact with developers';
    }
}

function insertToZone(zone, elem) {
    if (!elem || !zone) {
        return;
    }

    const insertToGridZone = (elem) => {
        elem.classList.remove('element_move');
        grid.append(elem);
        toggleGridScroll();
    };

    const insertToFreeZone = (elem) => {
        // calc element position in free zone
        elem.style.left = `${parseInt(elem.style.left, 10) - free.getBoundingClientRect().left - 1}px`;
        elem.style.top = `${parseInt(elem.style.top, 10) - free.getBoundingClientRect().top - 1}px`;
        free.append(elem);
    };

    leaveZone(zone);
    try {
        if (zone === grid) {
            insertToGridZone(elem);
        }
        if (zone === free) {
            insertToFreeZone(elem);
        }
    } catch (e) {
        error.innerHTML = 'Internal error, please contact with developers';
    }
}

function findZonesToHighlight(clientX, clientY) {
    leaveZone(grid);
    leaveZone(free);

    const targetZone = getTargetZone(clientX, clientY);
    if (!targetZone) {
        return;
    }

    enterZone(targetZone);
}

function moveAt(pageX, pageY) {
    if (!draggableElement.elem) {
        return;
    }
    draggableElement.elem.style.left = `${pageX - draggableElement.shiftX}px`;
    draggableElement.elem.style.top = `${pageY - draggableElement.shiftY}px`;
}

function startDrag(pageX, pageY, pointerType) {
    if (!draggableElement.elem) {
        return;
    }
    try {
        // turn off browser drag'n'drop
        draggableElement.elem.addEventListener('dragstart', () => false);

        // change element position and add to document body
        draggableElement.elem.classList.add('element_move');
        document.body.append(draggableElement.elem);

        // add events
        document.addEventListener('pointermove', documentPointerMoveHandler);
        if (pointerType === 'touch') {
            element.addEventListener('pointerup', elementPointerUpHandler);
        } else {
            draggableElement.elem.addEventListener('pointerup', elementPointerUpHandler);
        }

        // move to pointer position
        moveAt(pageX, pageY);
    } catch (e) {
        error.innerHTML = 'Internal error, please contact with developers';
    }
}

function documentPointerMoveHandler(event) {
    moveAt(event.pageX, event.pageY);
    findZonesToHighlight(event.clientX, event.clientY);
}

function elementPointerUpHandler(event) {
    // remove events
    document.removeEventListener('pointermove', documentPointerMoveHandler);
    event.target.removeEventListener('pointerup', elementPointerUpHandler);

    if (!draggableElement.elem) {
        return;
    }

    const targetZone = getTargetZone(event.clientX, event.clientY);
    if (!targetZone) {
        draggableElement.elem.remove();
    } else {
        insertToZone(targetZone, draggableElement.elem);
    }
    draggableElement = {};
}

function elementPointerDownHandler(event) {
    const targetElement = event.target;

    // clone element to move in zones
    const copy = targetElement.cloneNode(true);
    copy.removeAttribute('id');

    // change element color
    targetElement.style.backgroundColor = getRandomColor();

    // save shift of element to cursor
    draggableElement.shiftX = event.clientX - targetElement.getBoundingClientRect().left;
    draggableElement.shiftY = event.clientY - targetElement.getBoundingClientRect().top;

    draggableElement.elem = copy;

    startDrag(event.pageX, event.pageY, event.pointerType);
}

element.addEventListener('pointerdown', elementPointerDownHandler);

const resizeObserver = new ResizeObserver(() => {
    toggleGridScroll();
});

resizeObserver.observe(grid);
