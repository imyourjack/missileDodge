import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Difficulty, DIFFICULTY_CONFIGS } from '../constants/gameConfig';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DifficultySelectProps {
  onDifficultySelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({
  onDifficultySelect,
  onBack,
}) => {
  const renderDifficultyCard = (difficulty: Difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    
    return (
      <TouchableOpacity
        key={difficulty}
        style={[
          styles.difficultyCard,
          difficulty === 'hard' && styles.hardCard,
        ]}
        onPress={() => onDifficultySelect(difficulty)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <Text style={[
            styles.difficultyTitle,
            difficulty === 'hard' && styles.hardTitle,
          ]}>
            {config.name}
          </Text>
          {difficulty === 'hard' && (
            <Text style={styles.hardBadge}>🔥</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>난이도 선택</Text>
      </View>
      
      <View style={styles.difficultyContainer}>
        {renderDifficultyCard('normal')}
        {renderDifficultyCard('hard')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  backButton: {
    width: 35,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  difficultyContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 20,
  },
  difficultyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minHeight: 80,
  },
  hardCard: {
    backgroundColor: 'rgba(255, 87, 87, 0.1)',
    borderColor: 'rgba(255, 87, 87, 0.5)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  hardTitle: {
    color: '#ff5757',
  },
  hardBadge: {
    fontSize: 20,
    marginLeft: 8,
  },
});

export default DifficultySelect; 