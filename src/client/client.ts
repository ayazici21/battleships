import BattleshipsEvent from './BattleshipsEvent'
import Render from './Render'
import Position from '../common/Position'
import Point from './Point'
import Cell from './Cell'
import type Window from './types/index.d.ts'
import Board from './Board'

window.mouseClickEvent = function(position: Position) {
    const cell: Cell = window.shotsBoard.grid.getCell(position)
    // only shot at CELL_TYPE_FOG_OF_WAR makes sense
    if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
        return;
    }

    window.shotsBoard.active = false
    cell.setType(Cell.CELL_TYPE_CLICKED)

    window.socket.emit(BattleshipsEvent.EVENT_TYPE_SHOT, {
        'col': cell.position.col,
        'row': cell.position.row,
        'playerId': window.playerId,
        'gameId': window.gameId,
    });
}

window.onload = function() {
    console.log("gameId: " + window.gameId);

    window.render = new Render();

    window.socket = window.io()
    window.socket.on(BattleshipsEvent.EVENT_TYPE_CONNECTED, function(event) {
        window.playerId = event.playerId
        const d = new Date()
        d.setTime(d.getTime() + (1*24*60*60*1000))
        let expires = "expires="+ d.toUTCString()
        document.cookie = "playerId=" + window.playerId + ";" + expires + ";path=/"

        console.dir("connected to the server")
    });

    window.socket.on(BattleshipsEvent.EVENT_TYPE_INIT, function(event) {
        console.dir("init client")

        const shotsCanvas = document.getElementById("shots-board") as HTMLCanvasElement
        if (shotsCanvas == null) {
            throw Error("Can't find Shots board")
        }
        const shipsCanvas = document.getElementById("ships-board") as HTMLCanvasElement
        if (shipsCanvas == null) {
            throw Error("Can't find Ships board")
        }

        const startPoint = new Point(40, 40)
        const shotsGridCols: number = event.shots_grid[0].length
        const shotsGridRows: number = event.shots_grid.length
        shotsCanvas.width = 40 * 2 + 1 * 2 + shotsGridCols * 40
        shotsCanvas.height = 40 * 2 + 1 * 2 + shotsGridRows * 40
        const shotsMaxHorizontalStep: number = shotsCanvas.width / shotsGridCols
        const shotsMaxVertiacalStep: number = shotsCanvas.height / shotsGridRows
        const shotsCanvasMaxSide: number = (shotsMaxHorizontalStep < shotsMaxVertiacalStep) ? shotsCanvas.width : shotsCanvas.height
        window.shotsBoard = Board.initFromServerData(startPoint, shotsCanvasMaxSide, 1, event.shots_grid, true)
        window.render.drawEmptyBoard(shotsCanvas, window.shotsBoard)
        window.shotsBoard.setReady(true)
        window.render.drawSubstrate(shotsCanvas, window.shotsBoard)
        window.render.refreshGrid(shotsCanvas, window.shotsBoard)

        const shipsGridCols: number = event.ships_grid[0].length
        const shipsGridRows: number = event.ships_grid.length
        shipsCanvas.width = 40 * 2 + 1 * 2 + shipsGridCols * 40
        shipsCanvas.height = 40 * 2 + 1 * 2 + shipsGridRows * 40
        const shipsMaxHorizontalStep: number = shipsCanvas.width / shipsGridCols
        const shipsMaxVertiacalStep: number = shipsCanvas.height / shipsGridRows
        const shipsCanvasMaxSide: number = (shipsMaxHorizontalStep < shipsMaxVertiacalStep) ? shipsCanvas.width : shipsCanvas.height
        window.shipsBoard = Board.initFromServerData(startPoint, shipsCanvasMaxSide, 1, event.ships_grid, false)
        window.render.drawEmptyBoard(shipsCanvas, window.shipsBoard)
        window.shipsBoard.setReady(true)
        window.render.drawSubstrate(shipsCanvas, window.shipsBoard)
        window.render.refreshGrid(shipsCanvas, window.shipsBoard)

        function getMousePoint(canvasRect, clientX, clientY) {
            const x = clientX - canvasRect.left
            const y = clientY - canvasRect.top
            return new Point(x, y)
        }

        shotsCanvas.addEventListener('mousemove', function(board, e) {
            const rect = this.getBoundingClientRect()
            const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
            board.mouseMove(mousePoint)
            window.render.refreshGrid(this, board)
        }.bind(shotsCanvas, window.shotsBoard))

        shotsCanvas.addEventListener('click', function(board, e) {
            const rect = this.getBoundingClientRect()
            const mousePoint = getMousePoint(rect, e.clientX, e.clientY)
            board.mouseClick(mousePoint)
            window.render.refreshGrid(this, board)
        }.bind(shotsCanvas, window.shotsBoard))

        const gameDiv = document.getElementById("game-boards")
        if (gameDiv == null) {
            throw Error("Can't find Game Board")
        }
        gameDiv.style.visibility = 'visible';

        const waitingMessageDiv = document.getElementById("waiting-message")
        if (waitingMessageDiv == null) {
            throw Error("Can't find Game Board")
        }
        waitingMessageDiv.style.display = 'none';
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_WAITING, function(event) {
        console.log(`Waiting for the second player`)
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_JOINED, function(event) {
        console.log(`Player ${event.playerId} has joined the game`)
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_LEFT, function(event) {
        console.log(`Player ${event.playerId} has left the game`)
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_ANNOUNCE, function(event) {
        for (const u in event.ships_updates) {
            const upd =  event.ships_updates[u]
            window.shipsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(upd.type)
        }
        window.render.refreshGrid(document.getElementById("ships-board"), window.shipsBoard)

        for (const u in event.shots_updates) {
            const upd =  event.shots_updates[u]
            window.shotsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(upd.type)
        }
        window.render.refreshGrid(document.getElementById("shots-board"), window.shotsBoard)
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_ROUND, function(event) {
        window.shotsBoard.roundStart(event.number)
    })

    window.socket.on(BattleshipsEvent.EVENT_TYPE_GAME_RESULT, function(event) {
        switch (event.result) {
            case BattleshipsEvent.GAME_RESULT_WIN:
                alert("Congratulations, you won!")
                break
            case BattleshipsEvent.GAME_RESULT_DEFEAT:
                for (const u in event.opponent_ships) {
                    const upd =  event.opponent_ships[u]
                    window.shotsBoard.grid.getCell(new Position(upd.col, upd.row)).setType(Cell.CELL_TYPE_SHIP)
                }
                window.render.refreshGrid(document.getElementById("shots-board"), window.shotsBoard)
                alert("Defeat")
                break
            case BattleshipsEvent.GAME_RESULT_DRAW:
                alert("Draw")
                break
            default:
                throw new Error(`Unknown game result '${event.result}'`)
        }
    })
}