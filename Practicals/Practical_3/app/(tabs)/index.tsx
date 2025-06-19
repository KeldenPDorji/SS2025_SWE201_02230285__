import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  QuerySnapshot,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { FIRESTORE_DB } from '../../firebaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';

export interface Todo {
  title: string;
  done: boolean;
  id: string;
}

const List = ({ navigation }: any) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todo, setTodo] = useState('');

  useEffect(() => {
    const todoRef = collection(FIRESTORE_DB, 'todos');
    const unsubscribe = onSnapshot(todoRef, (snapshot: QuerySnapshot<DocumentData>) => {
      const todosData: Todo[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Todo, 'id'>),
      }));
      setTodos(todosData);
    });

    return () => unsubscribe();
  }, []);

  const addTodo = async () => {
    if (todo.trim().length === 0) return;
    await addDoc(collection(FIRESTORE_DB, 'todos'), {
      title: todo.trim(),
      done: false,
    });
    setTodo('');
    Keyboard.dismiss();
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const ref = doc(FIRESTORE_DB, `todos/${item.id}`);

    const toggleDone = async () => {
      await updateDoc(ref, { done: !item.done });
    };

    const deleteItem = async () => {
      await deleteDoc(ref);
    };

    return (
      <View style={styles.todoContainer}>
        <TouchableOpacity onPress={toggleDone} style={styles.todo}>
          {item.done ? (
            <Ionicons name="checkmark-circle" size={26} color="#4CAF50" />
          ) : (
            <Entypo name="circle" size={24} color="#bbb" />
          )}
          <Text style={[styles.todoText, item.done && styles.todoDone]}>{item.title}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={deleteItem}>
          <Ionicons name="trash" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Todo List</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Add a new task..."
          onChangeText={setTodo}
          value={todo}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.addButton, todo.trim() === '' && styles.addButtonDisabled]}
          onPress={addTodo}
          disabled={todo.trim() === ''}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {todos.length > 0 ? (
        <FlatList
          data={todos}
          renderItem={renderTodo}
          keyExtractor={(todo) => todo.id}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Text style={styles.noTasksText}>No tasks yet. Add one above!</Text>
      )}
    </View>
  );
};

export default List;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#F4F6F8',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  addButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#aacbe1',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  todoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  todo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  todoDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  noTasksText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
});
