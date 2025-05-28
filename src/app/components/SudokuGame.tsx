'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './SudokuGame.module.css';

type SudokuGrid = (number | null)[][];
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameState {
    grid: SudokuGrid;
    solution: SudokuGrid;
    initialGrid: SudokuGrid;
    selectedCell: { row: number; col: number } | null;
    errors: Set<string>;
    isComplete: boolean;
    timer: number;
    isTimerRunning: boolean;
}

const SudokuGame = () => {
    const [gameState, setGameState] = useState<GameState>({
        grid: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        solution: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        initialGrid: Array(9)
            .fill(null)
            .map(() => Array(9).fill(null)),
        selectedCell: null,
        errors: new Set(),
        isComplete: false,
        timer: 0,
        isTimerRunning: false,
    });

    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [showErrors, setShowErrors] = useState(true);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.isTimerRunning && !gameState.isComplete) {
            interval = setInterval(() => {
                setGameState((prev) => ({ ...prev, timer: prev.timer + 1 }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.isTimerRunning, gameState.isComplete]);

    // Generate a valid sudoku solution
    const generateSolution = (): SudokuGrid => {
        const grid: SudokuGrid = Array(9)
            .fill(null)
            .map(() => Array(9).fill(null));

        const isValid = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
            // Check row
            for (let x = 0; x < 9; x++) {
                if (grid[row][x] === num) return false;
            }

            // Check column
            for (let x = 0; x < 9; x++) {
                if (grid[x][col] === num) return false;
            }

            // Check 3x3 box
            const startRow = row - (row % 3);
            const startCol = col - (col % 3);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    if (grid[i + startRow][j + startCol] === num) return false;
                }
            }

            return true;
        };

        const solve = (grid: SudokuGrid): boolean => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (grid[row][col] === null) {
                        const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
                        for (const num of numbers) {
                            if (isValid(grid, row, col, num)) {
                                grid[row][col] = num;
                                if (solve(grid)) return true;
                                grid[row][col] = null;
                            }
                        }
                        return false;
                    }
                }
            }
            return true;
        };

        solve(grid);
        return grid;
    };

    // Create puzzle by removing numbers from solution
    const createPuzzle = (solution: SudokuGrid, difficulty: Difficulty): SudokuGrid => {
        const puzzle = solution.map((row) => [...row]);
        const cellsToRemove = {
            easy: 40,
            medium: 50,
            hard: 60,
        }[difficulty];

        const positions = [];
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
            const [row, col] = positions[i];
            puzzle[row][col] = null;
        }

        return puzzle;
    };

    // Start new game
    const startNewGame = useCallback(() => {
        const solution = generateSolution();
        const puzzle = createPuzzle(solution, difficulty);

        setGameState({
            grid: puzzle.map((row) => [...row]),
            solution,
            initialGrid: puzzle.map((row) => [...row]),
            selectedCell: null,
            errors: new Set(),
            isComplete: false,
            timer: 0,
            isTimerRunning: true,
        });
    }, [difficulty]);

    // Check if current state is valid
    const validateGrid = (grid: SudokuGrid): Set<string> => {
        const errors = new Set<string>();

        const isValidValue = (row: number, col: number, value: number): boolean => {
            // Check row
            for (let c = 0; c < 9; c++) {
                if (c !== col && grid[row][c] === value) return false;
            }

            // Check column
            for (let r = 0; r < 9; r++) {
                if (r !== row && grid[r][col] === value) return false;
            }

            // Check 3x3 box
            const startRow = Math.floor(row / 3) * 3;
            const startCol = Math.floor(col / 3) * 3;
            for (let r = startRow; r < startRow + 3; r++) {
                for (let c = startCol; c < startCol + 3; c++) {
                    if ((r !== row || c !== col) && grid[r][c] === value) return false;
                }
            }

            return true;
        };

        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const value = grid[row][col];
                if (value !== null && !isValidValue(row, col, value)) {
                    errors.add(`${row}-${col}`);
                }
            }
        }

        return errors;
    };

    // Handle cell click
    const handleCellClick = (row: number, col: number) => {
        if (gameState.initialGrid[row][col] !== null) return; // Can't edit initial numbers
        setGameState((prev) => ({
            ...prev,
            selectedCell: { row, col },
        }));
    };

    // Handle number input
    const handleNumberInput = (num: number | null) => {
        if (!gameState.selectedCell) return;

        const { row, col } = gameState.selectedCell;
        if (gameState.initialGrid[row][col] !== null) return;

        const newGrid = gameState.grid.map((r) => [...r]);
        newGrid[row][col] = num;

        const errors = showErrors ? validateGrid(newGrid) : new Set<string>();
        const isComplete = newGrid.every((row) => row.every((cell) => cell !== null)) && errors.size === 0;

        setGameState((prev) => ({
            ...prev,
            grid: newGrid,
            errors,
            isComplete,
            isTimerRunning: !isComplete,
        }));
    };

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!gameState.selectedCell) return;

            if (e.key >= '1' && e.key <= '9') {
                handleNumberInput(parseInt(e.key));
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                handleNumberInput(null);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [gameState.selectedCell]);

    // Format timer
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get hint
    const getHint = () => {
        if (!gameState.selectedCell) return;

        const { row, col } = gameState.selectedCell;
        if (gameState.initialGrid[row][col] !== null) return;

        const correctValue = gameState.solution[row][col];
        if (correctValue) {
            handleNumberInput(correctValue);
        }
    };

    // Initialize game on mount
    useEffect(() => {
        startNewGame();
    }, [startNewGame]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Sudoku</h1>
                <div className={styles.controls}>
                    <div className={styles.timer}>Time: {formatTime(gameState.timer)}</div>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className={styles.select}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button
                        onClick={startNewGame}
                        className={styles.button}>
                        New Game
                    </button>
                </div>
            </div>

            {gameState.isComplete && (
                <div className={styles.completion}>
                    🎉 Congratulations! You completed the puzzle in {formatTime(gameState.timer)}!
                </div>
            )}

            <div className={styles.gameArea}>
                <div className={styles.gridContainer}>
                    <div className={styles.grid}>
                        {gameState.grid.map((row, rowIndex) =>
                            row.map((cell, colIndex) => {
                                const isSelected =
                                    gameState.selectedCell?.row === rowIndex &&
                                    gameState.selectedCell?.col === colIndex;
                                const isInitial = gameState.initialGrid[rowIndex][colIndex] !== null;
                                const hasError = gameState.errors.has(`${rowIndex}-${colIndex}`);
                                const isInSameRow = gameState.selectedCell?.row === rowIndex;
                                const isInSameCol = gameState.selectedCell?.col === colIndex;
                                const isInSameBox =
                                    gameState.selectedCell &&
                                    Math.floor(gameState.selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                                    Math.floor(gameState.selectedCell.col / 3) === Math.floor(colIndex / 3);

                                return (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`${styles.cell} ${isSelected ? styles.selected : ''} ${
                                            isInitial ? styles.initial : ''
                                        } ${hasError ? styles.error : ''} ${
                                            isInSameRow || isInSameCol || isInSameBox ? styles.highlighted : ''
                                        }`}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}>
                                        {cell || ''}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.numberPad}>
                        <h3>Numbers</h3>
                        <div className={styles.numbers}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberInput(num)}
                                    className={styles.numberButton}
                                    disabled={
                                        !gameState.selectedCell ||
                                        (gameState.selectedCell &&
                                            gameState.initialGrid[gameState.selectedCell.row][
                                                gameState.selectedCell.col
                                            ] !== null)
                                    }>
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={() => handleNumberInput(null)}
                                className={`${styles.numberButton} ${styles.eraseButton}`}
                                disabled={
                                    !gameState.selectedCell ||
                                    (gameState.selectedCell &&
                                        gameState.initialGrid[gameState.selectedCell.row][
                                            gameState.selectedCell.col
                                        ] !== null)
                                }>
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button
                            onClick={getHint}
                            className={styles.button}
                            disabled={
                                !gameState.selectedCell ||
                                (gameState.selectedCell &&
                                    gameState.initialGrid[gameState.selectedCell.row][gameState.selectedCell.col] !==
                                        null)
                            }>
                            💡 Hint
                        </button>
                        <label className={styles.checkbox}>
                            <input
                                type="checkbox"
                                checked={showErrors}
                                onChange={(e) => setShowErrors(e.target.checked)}
                            />
                            Show Errors
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SudokuGame;
