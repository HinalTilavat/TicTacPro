import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BOARD_SIZE = 9;
const initialBoard = Array(BOARD_SIZE).fill(null);

const winningLines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const TicTacToe = () => {
  const [board, setBoard] = useState(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState('single');
  const [difficulty, setDifficulty] = useState('hard');
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [sound, setSound] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/click1.mp3'),
          { shouldPlay: false }
        );
        if (isMounted) setSound(sound);
      } catch (e) {
        console.warn('Failed to load sound', e);
        setSoundEnabled(false);
      }
    })();
    return () => {
      isMounted = false;
      sound && sound.unloadAsync();
    };
  }, []);

  const playSound = useCallback(async () => {
    // console.log('Playing sound:', soundEnabled);
    if (soundEnabled && sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch (e) {
        console.warn('Play sound failed', e);
      }
    }
  }, [sound, soundEnabled]);

  const evaluateWinner = useCallback((squares) => {
    for (const [a, b, c] of winningLines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return squares.includes(null) ? null : 'draw';
  }, []);

  const updateGameState = async (index) => {
    if (board[index] || winner) return;

    const newBoard = board.slice();
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    await playSound();

    const gameWinner = evaluateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner !== 'draw') {
        setScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }));
      }
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const handleClick = (index) => {
    if (gameMode === 'multi' || currentPlayer === 'X') {
      updateGameState(index);
    }
  };

  const makeComputerMove = useCallback(async (currentBoard) => {
    let move;
    if (difficulty === 'hard') {
      const evaluate = (b) => {
        for (const [a, bIdx, c] of winningLines) {
          if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
            return b[a] === 'O' ? 10 : -10;
          }
        }
        return 0;
      };

      const minimax = (b, depth, isMax) => {
        const score = evaluate(b);
        if (score !== 0) return score - depth * (score / Math.abs(score));
        if (!b.includes(null)) return 0;

        let best = isMax ? -Infinity : Infinity;
        for (let i = 0; i < 9; i++) {
          if (!b[i]) {
            b[i] = isMax ? 'O' : 'X';
            const value = minimax(b, depth + 1, !isMax);
            b[i] = null;
            best = isMax ? Math.max(best, value) : Math.min(best, value);
          }
        }
        return best;
      };

      let bestVal = -Infinity;
      move = -1;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = 'O';
          const val = minimax(currentBoard, 0, false);
          currentBoard[i] = null;
          if (val > bestVal) {
            bestVal = val;
            move = i;
          }
        }
      }
    } else {
      const available = currentBoard
        .map((v, i) => (v === null ? i : null))
        .filter((v) => v !== null);
      move = available[Math.floor(Math.random() * available.length)];
    }

    await playSound();
    const newBoard = [...currentBoard];
    newBoard[move] = 'O';
    setBoard(newBoard);
    const gameWinner = evaluateWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner !== 'draw') {
        setScores((prev) => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }));
      }
    } else {
      setCurrentPlayer('X');
    }
  }, [difficulty, evaluateWinner, playSound]);

  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 'O' && !winner) {
      const timeout = setTimeout(() => makeComputerMove(board), 300);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, gameMode, board, winner, makeComputerMove]);

  const resetGame = () => {
    setBoard(initialBoard);
    setCurrentPlayer('X');
    setWinner(null);
  };

  const toggleGameMode = () => {
    setGameMode((prev) => (prev === 'single' ? 'multi' : 'single'));
    resetGame();
  };

  const toggleDifficulty = () => {
    setDifficulty((prev) => (prev === 'easy' ? 'hard' : 'easy'));
    resetGame();
  };

  const toggleSound = () => setSoundEnabled((prev) => !prev);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tic Tac Toe</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={toggleGameMode} style={styles.modeButton}>
          <Text style={styles.modeButtonText}>{gameMode === 'single' ? 'Single Player' : 'Two Players'}</Text>
        </TouchableOpacity>

        {gameMode === 'single' && (
          <TouchableOpacity onPress={toggleDifficulty} style={styles.difficultyButton}>
            <Text style={styles.difficultyButtonText}>{difficulty}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={toggleSound}
          style={[styles.soundButton, !soundEnabled && styles.soundButtonDisabled]}>
          <Text style={styles.soundButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scoreBoard}>
        <Text style={[styles.scoreText, styles.xText]}>X: {scores.X}</Text>
        <Text style={[styles.scoreText, styles.oText]}>O: {scores.O}</Text>
      </View>

      <Text style={[styles.statusText, winner === 'X' ? styles.xText : winner === 'O' ? styles.oText : null]}>
        {winner ? (winner === 'draw' ? "It's a draw!" : `Winner: ${winner}`) : `Turn: ${currentPlayer}`}
      </Text>

      <View style={styles.board}>
        {board.map((val, i) => (
          <TouchableOpacity key={i} style={styles.square} onPress={() => handleClick(i)}>
            <Text style={[styles.squareText, val === 'X' ? styles.xText : styles.oText]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: Dimensions.get('window').width - 40,
    aspectRatio: 1,
    marginTop: 20,
  },
  square: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  squareText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  xText: {
    color: '#E91E63',
  },
  oText: {
    color: '#2196F3',
  },
  statusText: {
    fontSize: 20,
    marginTop: 10,
  },
  resetButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  modeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
  },
  modeButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  difficultyButton: {
    backgroundColor: '#FF9800',
    padding: 10,
    borderRadius: 8,
  },
  difficultyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  soundButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
  },
  soundButtonDisabled: {
    backgroundColor: '#ccc',
  },
  soundButtonText: {
    fontSize: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default TicTacToe;
