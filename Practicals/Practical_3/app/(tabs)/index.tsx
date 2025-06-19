import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { FIRESTORE_DB } from '../../firebaseConfig';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: any;
}

const { width } = Dimensions.get('window');

const TodoManager = ({ navigation }: any) => {
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time listener for tasks
  useEffect(() => {
    // Try without ordering first to see if that's the issue
    const tasksCollection = collection(FIRESTORE_DB, 'todos');
    
    // If you want ordering, uncomment the next line and comment the line above
    // const tasksQuery = query(tasksCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      tasksCollection, // Use tasksQuery if you want ordering
      (querySnapshot) => {
        const tasks: TaskItem[] = [];
        querySnapshot.forEach((document) => {
          const data = document.data();
          console.log('Document data:', data); // Debug log
          tasks.push({
            id: document.id,
            text: data.title || data.text || '', // Prioritize 'title' since that's what we're creating
            completed: data.done || data.completed || false, // Prioritize 'done' since that's what we're creating
            createdAt: data.createdAt,
          });
        });
        console.log('Mapped tasks:', tasks); // Debug log
        setTaskList(tasks);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createNewTask = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText) {
      Alert.alert('Invalid Input', 'Please enter a valid task');
      return;
    }

    setIsLoading(true);
    try {
      // Use the same field names as your friend's code for compatibility
      await addDoc(collection(FIRESTORE_DB, 'todos'), {
        title: trimmedText, // Using 'title' to match existing data
        done: false,        // Using 'done' to match existing data
        createdAt: serverTimestamp(),
      });
      setInputText('');
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task');
    }
    setIsLoading(false);
  }, [inputText]);

  const updateTaskStatus = useCallback(async (taskId: string, currentStatus: boolean) => {
    try {
      const taskRef = doc(FIRESTORE_DB, 'todos', taskId);
      await updateDoc(taskRef, {
        done: !currentStatus, // Use 'done' to match the field name we're creating
      });
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  }, []);

  const removeTask = useCallback(async (taskId: string, taskText: string) => {
    console.log('Delete button pressed for task:', taskId);
    
    try {
      if (!taskId) {
        console.error('No task ID provided');
        return;
      }
      
      // Delete without confirmation dialog first to test
      const taskDocRef = doc(FIRESTORE_DB, 'todos', taskId);
      await deleteDoc(taskDocRef);
      console.log('Task deleted successfully');
      
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', `Failed to delete: ${error}`);
    }
  }, []);

  const TaskComponent = ({ item }: { item: TaskItem }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => updateTaskStatus(item.id, item.completed)}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          {item.completed ? (
            <MaterialIcons name="check-box" size={28} color="#2ECC71" />
          ) : (
            <MaterialIcons name="check-box-outline-blank" size={28} color="#BDC3C7" />
          )}
        </View>
        <Text style={[styles.taskText, item.completed && styles.completedTask]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => removeTask(item.id, item.text)}
      >
        <AntDesign name="delete" size={22} color="#E74C3C" />
      </TouchableOpacity>
    </View>
  );

  const completedCount = taskList.filter(task => task.completed).length;
  const totalCount = taskList.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ECF0F1" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drac's Todo List</Text>
        <Text style={styles.progressText}>
          {completedCount} of {totalCount} completed
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }
            ]} 
          />
        </View>
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="What needs to be done?"
            value={inputText}
            onChangeText={setInputText}
            multiline={false}
            maxLength={100}
          />
          <TouchableOpacity
            style={[styles.addButton, !inputText.trim() && styles.disabledButton]}
            onPress={createNewTask}
            disabled={!inputText.trim() || isLoading}
          >
            <MaterialIcons 
              name="add" 
              size={24} 
              color={inputText.trim() ? '#FFFFFF' : '#BDC3C7'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task List Section */}
      <View style={styles.listSection}>
        {taskList.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment-turned-in" size={80} color="#BDC3C7" />
            <Text style={styles.emptyStateText}>No tasks yet!</Text>
            <Text style={styles.emptyStateSubtext}>Add your first task above</Text>
          </View>
        ) : (
          <FlatList
            data={taskList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TaskComponent item={item} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 3,
  },
  inputSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#2C3E50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#F8F9FA',
    shadowOpacity: 0,
    elevation: 0,
  },
  listSection: {
    flex: 1,
    paddingTop: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginVertical: 6,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  taskText: {
    flex: 1,
    fontSize: 17,
    color: '#2C3E50',
    lineHeight: 24,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#95A5A6',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#BDC3C7',
  },
});

export default TodoManager;