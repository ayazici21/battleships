import Point from './Point'
import Cell from './Cell'
import Position from '../common/Position'
import Ship from './Ship'

class Grid {
    private cells: Cell[][]
    readonly cols: number
    readonly rows: number

    constructor(cells: Cell[][]) {
        this.cells = cells
        this.cols = cells[0].length
        this.rows = cells.length
    }

    doesCellExist(position: Position): boolean {
        if (!(position.col in this.cells)) {
            return false
        }

        if (!(position.row in this.cells[position.col])) {
            return false
        }

        return true
    }

    getCell(position: Position): Cell {
        return this.cells[position.row][position.col]
    }

    mouseMove(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseMove(point)
            }
        }
    }

    mouseClick(point: Point): void {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseClick(point)
            }
        }
    }

    mouseDown(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseDown(point)
            }
        }
    }

    mouseUp(point: Point) {
        for (var r = 0; r < this.rows; r++) {
            for (var c = 0; c < this.cols; c++) {
                const p = new Position(c, r)
                const cell = this.getCell(p)
                cell.mouseUp(point)
            }
        }
    }

    /**
     * TODO: get rid of it
     * @deprecated use getCell().setType() instead
     */
    setCellType(position: Position, cellType: number): void {
        const cell = this.getCell(position)
        cell.setType(cellType)
    }

    // canPlaceShip(ship: Ship): boolean {
    //     for (const section of ship.sections) {
    //         const cell = this.getCell(section.position)
    //         if (cell.getType() !== Cell.CELL_TYPE_FOG_OF_WAR) {
    //             return false
    //         }
    //     }

    //     return true
    // }

}

export default Grid