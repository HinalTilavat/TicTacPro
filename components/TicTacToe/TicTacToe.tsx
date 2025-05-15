import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Player = 'X' | 'O' | null;
type GameMode = 'single' | 'multi';

const TicTacToe: React.FC = () => {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    loadSound();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/click.mp3'),
        { shouldPlay: false }
      );
      setSound(sound);
    } catch (error) {
      console.log('Sound disabled: Could not load sound file');
      setSoundEnabled(false);
    }
  };

  const playSound = async () => {
    if (!soundEnabled && !sound) return;

    try {
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    if (newState && !sound) {
      loadSound(); // reload sound if it was unloaded
    }
  };

  const checkWinner = (squares: Player[]): Player | 'draw' | null => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6], // diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }

    if (squares.every(square => square !== null)) {
      return 'draw';
    }

    return null;
  };

  const handleClick = async (index: number) => {
    if (board[index] || winner) return;

    await playSound();
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      if (gameWinner !== 'draw') {
        setScores(prev => ({
          ...prev,
          [gameWinner]: prev[gameWinner] + 1,
        }));
      }
      return;
    }

    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  useEffect(() => {
    if (gameMode === 'single' && currentPlayer === 'O' && !winner) {
      const timer = setTimeout(() => makeComputerMove(board), 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, board, winner]);

  const makeComputerMove = (currentBoard: Player[]) => {
    const emptySquares = currentBoard
      .map((square, index) => (square === null ? index : null))
      .filter(index => index !== null) as number[];

    if (emptySquares.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptySquares.length);
      const index = emptySquares[randomIndex];

      const newBoard = [...currentBoard];
      newBoard[index] = 'O';
      setBoard(newBoard);

      const gameWinner = checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        if (gameWinner !== 'draw') {
          setScores(prev => ({
            ...prev,
            [gameWinner]: prev[gameWinner] + 1,
          }));
        }
        return;
      }

      setCurrentPlayer('X');
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
  };

  const toggleGameMode = () => {
    setGameMode(prev => (prev === 'single' ? 'multi' : 'single'));
    resetGame();
  };

  const renderSquare = (index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.square}
      onPress={() => {
        if (!board[index] && !winner) handleClick(index);
      }}
    >
      <Text style={styles.squareText}>{board[index]}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tic Tac Toe</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.modeButton} onPress={toggleGameMode}>
            <Text style={styles.modeButtonText}>
              {gameMode === 'single' ? 'Single Player' : 'Two Players'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.soundButton, !soundEnabled && styles.soundButtonDisabled]}
            onPress={toggleSound}
          >
            <Text style={styles.soundButtonText}>
              {soundEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.scoreBoard}>
        <Text style={styles.scoreText}>Player X: {scores.X}</Text>
        <Text style={styles.scoreText}>Player O: {scores.O}</Text>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>
          {winner
            ? winner === 'draw'
              ? "It's a Draw!"
              : `Winner: ${winner}`
            : `Current Player: ${currentPlayer}`}
        </Text>
      </View>

      <View style={styles.board}>
        {board.map((_, index) => renderSquare(index))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modeButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 8,
  },
  modeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  status: {
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: Dimensions.get('window').width - 40,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  square: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  resetButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  soundButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  soundButtonDisabled: {
    backgroundColor: '#ccc',
  },
  soundButtonText: {
    fontSize: 20,
  },
});

export default TicTacToe;
