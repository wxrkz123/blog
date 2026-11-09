---
title: C implements data structures
typora-root-url: C implements data structures
mathjax: false
top: false
cover: false
date: 2023-09-12 23:58:55
categories: Program
tags:
	- program
	- data Structure and alagorithm
	- computer
---

## 1-1.c语言实现linked_list

```c
#include <stdio.h>
#include <stdlib.h>

// Definition of the linked_list structure.
typedef struct linked_list
{
    int data; // The data stored in the node.
    struct linked_list *next; // Pointer to the next node.
}linked_list;

// Function to create a new linked_list node.
linked_list *create_linked_list(int data) {
    linked_list *new_linked_list = malloc(sizeof(linked_list)); // Allocate memory for the new node.
    new_linked_list->data = data; // Set the data.
    new_linked_list->next = NULL; // Set the next pointer to NULL.
    return new_linked_list; // Return the new node.
}

// Function to insert a new node at the beginning of the list.
void insert_at_begin(linked_list **head, int data) {
    linked_list *new_linked_list = create_linked_list(data); // Create a new node.
    new_linked_list->next = *head; // Set the next pointer of the new node to the current head.
    *head = new_linked_list; // Set the new node as the head of the list.
}

// Function to insert a new node at the end of the list.
void insert_at_end(linked_list **head, int data) {
    linked_list *new_linked_list = create_linked_list(data); // Create a new node.
    if (*head == NULL) {
        *head = new_linked_list; // If the list is empty, set the new node as the head.
        return ;
    }
    linked_list *current = *head;
    while (current->next != NULL){
        current = current->next; // Traverse to the end of the list.
    }
    current->next = new_linked_list; // Insert the new node at the end of the list.
}

// Function to delete a node from the list.
void delete_linked_list(linked_list **head, int data) {
    linked_list *current = *head;
    linked_list *previous = NULL;
    while (current != NULL) {
        if (current->data == data) // If the node to be deleted is found.
        {
            if (previous == NULL) {
                *head = current->next; // If the node to be deleted is the head, update the head.
            }else{
                previous->next = current->next; // Otherwise, bypass the node to be deleted.
            }
            free(current); // Free the memory of the deleted node.
            return ;
        }
        previous = current;
        current = current->next; // Move to the next node.
    }
}

// Function to print the list.
void print_list(linked_list *head) {
    linked_list *current = head;
    while (current != NULL) // While there are nodes left.
    {
        printf("%d",current->data); // Print the data of the current node.
        current = current->next; // Move to the next node.
    }
    printf("\n"); // Print a newline at the end.
}

// Main function.
int main(int argc,char const *argv[]){
    linked_list *head = NULL; // Initialize the head of the list to NULL.

    insert_at_begin(&head,1); // Insert 1 at the beginning of the list.
    insert_at_begin(&head,2); // Insert 2 at the beginning of the list.
    insert_at_begin(&head,3); // Insert 3 at the beginning of the list.

    insert_at_end(&head,4); // Insert 4 at the end of the list.
    insert_at_end(&head,5); // Insert 5 at the end of the list.

    print_list(head); // Print the list.

    delete_linked_list(&head,4); // Delete the node with data 4.

    print_list(head); // Print the list after the deletion.

    return 0; // Exit the program.
}
```

## 1-2.c语言实现dynamic_array

```c
#include <stdio.h>
#include <stdlib.h>

// Define a dynamic array structure that stores an array and its size.
typedef struct {
    int* array;// Pointer to an integer array.
    size_t size; // Size of the array
} dynamic_array;

// Fuction to create a new dynamic array.
dynamic_array* create_array (size_t size) {
    dynamic_array* arr = malloc(sizeof(dynamic_array));// Allocate memory for the dynamic array structure.
    arr->array = malloc(size * sizeof(int));// Allocate memory for the integer array inside the structure.
    arr->size = size;// Set the size of the array.
    return arr; // Return the pointer to the created dynamic array.
}

// Fuction to read an element from dynamic array.
int read_array(dynamic_array* arr,size_t index) {
    if(index<arr->size) {// If the index is within the bounds.
        return arr->array[index];// Return the value at the specified index.
    }else{
        printf("Error : index out of bounds: %d\n",index);// Print error message.
        return -1;// Return -1 to indicate an error.
    }
}

// Fuction to update an element from a dynamic array.
void update_array(dynamic_array* arr, size_t index, int value) {
    if(index<arr->size) {// If the index is within the bounds.
        arr->array[index] = value;// Update the value at the specified index.
    }else{
        printf("Error : index out of bounds: %d\n",index);// Print error message.
    }
}

// Fuction to delete a dynamic array.
void delete_array(dynamic_array* arr) {
    free(arr->array);// Free the memory allocated for the integer array.
    free(arr);// Free the memory allocated for the dynamic array structure.
}

// main 
int main() {
    // Create a new dynamic array
    dynamic_array* arr = create_array(10);

    // Update the 5th element in the array with the value 100000.
    update_array(arr,5,100000);

    // Read the 5th element from the array.
    int value = read_array(arr,5);

    // Print the value.
    printf("The value is : %d\n", value);

    // Delete the dynamic array.
    delete_array(arr);
    
    return 0; // The program executed successfully.
}
```

## 1-3 c语言实现hash

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define TABLE_SIZE 10

// Define the structure for the hash table.
typedef struct hash_table
{
    int size; // Size of the hash table.
    int num_elements; // Number of elements in the hash table.
    char** keys; // Array of keys.
    int* values; // Array of values.
} HashTable;

// Function to initialize the hash table.
HashTable* init_table() {
    HashTable* table = malloc(sizeof(HashTable)); // Allocate memory for the hash table.
    table->size = TABLE_SIZE; // Set the size of the hash table.
    table->num_elements = 0; // Initialize the number of elements to 0.
    table->keys = malloc(table->size * sizeof(char*)); // Allocate memory for the keys.
    table->values = malloc(table->size * sizeof(int)); // Allocate memory for the values.

    // Initialize all keys to NULL and all values to 0.
    for (int i = 0; i < table->size; i++)
    {
        table->keys[i] = NULL;
        table->values[i] = 0;
    }
    return table; // Return the initialized hash table.
}

// Function to compute the hash code for the given key.
int hash(char* key) {
    int hash = 0;
    for(int i = 0; i < strlen(key); i++) {
        hash = (hash + key[i]) % TABLE_SIZE; // Compute the hash code.
    }
    return hash; // Return the hash code.
}

// Function to insert a key-value pair into the hash table.
void put(HashTable* table,char* key,int value) {
    int index = hash(key); // Compute the hash code.

    // Find an empty slot or a slot containing the same key.
    while (table->keys[index] != NULL && strcmp(table->keys[index],key) != 0)
    {
        index = (index + 1) % table->size; // Linear probing.
    }
    if(table->values[index] != 0){
        table->num_elements++; // Increase the number of elements.
    }
    table->keys[index] = key; // Store the key.
    table->values[index] = value; // Store the value.
}

// Function to retrieve the value for a given key.
int get(HashTable* table,char* key) {
    int index = hash(key); // Compute the hash code.

    // Find the slot containing the key.
    while (table->keys[index] != NULL && strcmp(table->keys[index],key) != 0)
    {
        index = (index + 1) % table->size; // Linear probing.
    }
    if(table->keys[index] == NULL){
        return -1; // If the key is not found, return -1.
    }
    return table->values[index]; // Return the corresponding value.
}

// Function to remove a key-value pair from the hash table.
void remove_key(HashTable *table,char *key) {
    int index = hash(key); // Compute the hash code.

    // Find the slot containing the key.
    while (table->keys[index] != NULL && strcmp(table->keys[index],key) != 0)
    {
        index = (index + 1) % table->size; // Linear probing.
    }
    if(table->keys[index] == NULL){
        return ; // If the key is not found, do nothing.
    }
    table->keys[index] = NULL; // Remove the key.
    table->values[index] = 0; // Remove the value.
    table->num_elements--; // Decrease the number of elements.
}

// Function to compute the load factor of the hash table.
float load_factor(HashTable* table) {
    return (float)table->num_elements / (float)table->size; // Load factor is the ratio of the number of elements to the size of the hash table.
}

// Function to get the number of elements in the hash table.
int num_elements(HashTable* table) {
    return table->num_elements; // Return the number of elements.
}

// Main function.
int main() {
    HashTable* table = init_table(); // Initialize a new hash table.

    // Insert three key-value pairs into the hash table.
    put(table, "key1", 10);
    put(table, "key2", 20);
    put(table, "key3", 30);

    // Print the number of elements and the load factor.
    printf("Number of elements: %d\n", num_elements(table));
    printf("Load factor: %.2f\n", load_factor(table));

    // Print the value of each key.
    printf("Value of key1: %d\n", get(table, "key1"));
    printf("Value of key2: %d\n", get(table, "key2"));
    printf("Value of key3: %d\n", get(table, "key3"));

    // Remove a key from the hash table.
    remove_key(table, "key2");

    // Print the number of elements and the load factor after removing a key.
    printf("Number of elements after removing a key: %d\n", num_elements(table));
    printf("Load factor after removing a key: %.2f\n", load_factor(table));

    // Print the value of the removed key.
    printf("Value of key2 after removing it: %d\n", get(table, "key2"));

    return 0; // Exit the program.
}
```

## 1-4 c语言实现stack

```c
#include <stdio.h>
#include <stdlib.h>

#define STACK_SIZE 100 // Define the maximum size of the stack.

// Definition of the Stack structure.
typedef struct 
{
    int data[STACK_SIZE]; // Array to hold the stack elements.
    int top; // Index of the top element in the stack.
} Stack;

// Function to initialize a stack.
void init_stack(Stack *stack) {
    stack->top = -1; // Set the index of the top element to -1 indicating an empty stack.
}

// Function to check if the stack is empty.
int is_empty(Stack *stack) {
    return stack->top == -1; // Returns 1 if stack is empty, 0 otherwise.
}

// Function to check if the stack is full.
int is_full(Stack *stack) {
    return stack->top == STACK_SIZE - 1; // Returns 1 if stack is full, 0 otherwise.
}

// Function to push a new element onto the stack.
void push(Stack *stack,int x) {
    if (is_full(stack)) {
        printf("Error: Stack is full\n"); // If the stack is full, print an error message and return.
        return ;
    }

    stack->top++; // Increment the top index.
    stack->data[stack->top] = x; // Insert the new element at the new top index.
}

// Function to pop an element from the stack.
int pop(Stack *stack) {
    if (is_empty(stack)) {
        printf("Error: Stack is empty\n"); // If the stack is empty, print an error message and return -1.
        return -1;
    }

    int x = stack->data[stack->top]; // Store the top element.
    stack->top--; // Decrement the top index.
    return x; // Return the popped element.
}

// Function to return the top element of the stack without removing it.
int peek(Stack* stack) {
    if (is_empty(stack)) {
        printf("Error: Stack is empty\n"); // If the stack is empty, print an error message and return -1.
        return -1;
    }
    return stack->data[stack->top]; // Return the top element.
}

// main function.
int main(int argc,char const *argv[]) {
    Stack s; // Declare a stack.
    init_stack(&s); // Initialize the stack.
    push(&s,1); // Push 1 onto the stack.
    push(&s,2); // Push 2 onto the stack.
    push(&s,3); // Push 3 onto the stack.
    printf("%d\n",pop(&s)); // Pop the top element from the stack and print it.
    printf("%d\n",peek(&s)); // Print the top element of the stack.
    printf("%d\n",is_empty(&s)); // Print 1 if the stack is empty, 0 otherwise.
    printf("%d\n",is_full(&s)); // Print 1 if the stack is full, 0 otherwise.
    return 0; // Exit the program.
}
```

## 1-5 c语言实现graph

```c
#include <stdio.h>
#include <stdlib.h>

#define MAX_NODES 100 // Define the maximum number of nodes in the graph.

// Define the Node structure.
struct Node
{
    int data; // Value of the node.
    struct Node *next; // Pointer to the next node in the adjacency list.
};

// Define the Graph structure.
struct Graph
{
    int numNodes; // Number of nodes in the graph.
    struct Node *adjLists[MAX_NODES]; // Array of pointers to the adjacency lists of the nodes.
};

// Function to create a new Graph.
struct Graph *createGraph() {
    struct Graph *graph = (struct Graph *) malloc(sizeof(struct Graph)); // Allocate memory for a new graph.
    graph->numNodes = 0; // Initialize the number of nodes to 0.
    for (int index = 0; index < MAX_NODES;index++){
        graph->adjLists[index] = NULL;  // Initialize all adjacency lists to NULL.
    }
    return graph; // Return the new graph.
}

// Function to add a Node to a Graph.
void addNode(struct Graph *graph,int data) {
    struct Node *node = (struct Node*)malloc(sizeof(struct Node)); // Allocate memory for a new node.
    node->data = data; // Set the node's data.
    node->next = NULL; // Initialize the next pointer to NULL.
    graph->adjLists[graph->numNodes++] = node; // Add the node to the graph and increment the number of nodes.
}

// Function to add an Edge to a Graph.
void addEdge(struct Graph *graph,int src,int dest) {
    struct Node *srcNode = graph->adjLists[src]; // Find the source node.
    struct Node *destNode = graph->adjLists[dest]; // Find the destination node.
    srcNode->next = destNode; // Add the destination node to the source node's adjacency list.
}

// main function to test the graph functions.
int main(int argc,char const *argv[]) {
    struct Graph *graph = createGraph(); // Create a new graph.
    addNode(graph,0); // Add node 0 to the graph.
    addNode(graph,1); // Add node 1 to the graph.
    addNode(graph,2); // Add node 2 to the graph.
    addNode(graph,3); // Add node 3 to the graph.
    addEdge(graph,0,1); // Add an edge from node 0 to node 1.
    addEdge(graph,0,2); // Add an edge from node 0 to node 2.
    addEdge(graph,1,2); // Add an edge from node 1 to node 2.
    addEdge(graph,2,3); // Add an edge from node 2 to node 3.

    // Print the adjacency lists of the nodes.
    for (int index = 0;index < graph->numNodes; index++) {
        struct Node *curr_node = graph->adjLists[index];
        printf("Adjacency list for node %d:",index);
        while (curr_node)
        {
            printf("%d -> ",curr_node->data); // Print the node's data.
            curr_node = curr_node->next; // Move to the next node in the adjacency list.
        }
        printf("NULL\n"); // End of the adjacency list.
    }
    return 0;
}
```

## 1-6 c语言实现prefect_brinay_tree

```c
#include <stdio.h>
#include <stdlib.h>

// Define the TreeNode structure.
typedef struct TreeNode
{
    int data; // Value of the node.
    struct TreeNode *left; // Pointer to the left child.
    struct TreeNode *right; // Pointer to the right child.
} TreeNode;

// Function to create a new TreeNode.
TreeNode* createnode(int data) {
    TreeNode *node = (TreeNode*) malloc(sizeof(TreeNode)); // Allocate memory for a new node.
    node->data = data; // Set the node's data.
    node->left = NULL; // Initialize the left child pointer to NULL.
    node->right = NULL; // Initialize the right child pointer to NULL.

    return node; // Return the new node.
}

// Function to create a perfect binary tree from a sorted array.
TreeNode* createPrefectBinaryTree(int *array,int start,int end) {
    if (start > end) {
        return NULL; // If the array is empty, return NULL.
    }
    int mid = (start + end)/2; // Find the middle element of the array.
    TreeNode *node = createnode(array[mid]); // Create a new node with the middle element.
    node->left = createPrefectBinaryTree(array,start,mid-1); // Recursively create the left subtree.
    node->right = createPrefectBinaryTree(array,mid+1,end); // Recursively create the right subtree.
    return node; // Return the root node of the tree.
}

// Function to traverse a binary tree in pre-order (root, left, right).
void preOrderTraveral(TreeNode* root) {
    if (root == NULL) {
        return; // If the tree is empty, return.
    }
    printf("%d\n",root->data); // Print the root node's data.
    preOrderTraveral(root->left); // Recursively traverse the left subtree.
    preOrderTraveral(root->right); // Recursively traverse the right subtree.
}

// main function to test the binary tree functions.
int main(int argc, char const *argv[])
{
    int array[] = {1,2,3,4,5,6,7,8,9}; // Sorted array to be converted to a binary tree.
    int size = sizeof(array)/sizeof(int); // Size of the array.
    TreeNode *root = createPrefectBinaryTree(array,0,size-1); // Create a perfect binary tree from the array.
    preOrderTraveral(root); // Traverse the binary tree in pre-order and print the nodes.
    printf("\n");
    return 0;
}
```

## 1-7 c语言实现queue

```c
#include <stdio.h>
#include <stdlib.h>

#define QUEUE_SIZE 100 // Define the maximum size of the queue.

// Definition of the Queue structure.
typedef struct 
{
    int data[QUEUE_SIZE]; // Array to hold the queue elements.
    int head; // Index of the front element in the queue.
    int tail; // Index of the rear element in the queue.
}Queue;

// Function to initialize a queue.
void init_queue(Queue *queue) {
    queue->head = 0; // Set the index of the front element to 0.
    queue->tail = 0; // Set the index of the rear element to 0.
}

// Function to check if the queue is empty.
int is_empty(Queue *queue) {
    return queue->head == queue->tail; // Returns 1 if queue is empty, 0 otherwise.
}

// Function to check if the queue is full.
int is_full(Queue *queue) {
    return queue->head == QUEUE_SIZE; // Returns 1 if queue is full, 0 otherwise.
}

// Function to add an element to the end of the queue.
void enqueue(Queue *queue, int value) {
    if (is_full(queue)) {
        printf("Error: queue is full.\n "); // If the queue is full, print an error message and return.
        return;
    }
    queue->data[queue->tail] = value; // Insert the new element at the end of the queue.
    queue->tail++; // Increment the tail index.
}

// Function to remove an element from the front of the queue.
int dequeue(Queue *queue) {
    if (is_empty(queue)) {
        printf("Error: queue is empty.\n "); // If the queue is empty, print an error message and return -1.
        return -1;
    }
    
    int value = queue->data[queue->head]; // Store the front element.
    queue->head++; // Increment the head index.
    return value; // Return the removed element.
}

// Function to return the front element of the queue without removing it.
int peek(Queue *queue) {
    if (is_empty(queue)) {
        printf("Error: queue is empty.\n "); // If the queue is empty, print an error message and return -1.
        return -1;
    }
    return queue->data[queue->head]; // Return the front element.
}

// main function to test the queue.
int main(int argc, char const *argv[])
{
    Queue q; // Declare a queue.
    init_queue(&q); // Initialize the queue.
    enqueue(&q,5); // Add 5 to the queue.
    enqueue(&q,10); // Add 10 to the queue.
    printf("%d\n", dequeue(&q)); // Remove the front element from the queue and print it.
}
```

