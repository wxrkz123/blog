---
title: C implements data structures
date: 2023-09-12 12:00:00
tags:
  - program
  - data Structure and alagorithm
  - computer
categories:
  - Program
rawhtml: true
---
<h2 id="1-1-c语言实现linked-list"><a href="#1-1-c语言实现linked-list" class="headerlink" title="1-1.c语言实现linked_list"></a>1-1.c语言实现linked_list</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token comment">// Definition of the linked_list structure.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token class-name">linked_list</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> data<span class="token punctuation">;</span> <span class="token comment">// The data stored in the node.</span>
    <span class="token keyword">struct</span> <span class="token class-name">linked_list</span> <span class="token operator">*</span>next<span class="token punctuation">;</span> <span class="token comment">// Pointer to the next node.</span>
<span class="token punctuation">&#125;</span>linked_list<span class="token punctuation">;</span>

<span class="token comment">// Function to create a new linked_list node.</span>
linked_list <span class="token operator">*</span><span class="token function">create_linked_list</span><span class="token punctuation">(</span><span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>new_linked_list <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>linked_list<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for the new node.</span>
    new_linked_list<span class="token operator">-></span>data <span class="token operator">=</span> data<span class="token punctuation">;</span> <span class="token comment">// Set the data.</span>
    new_linked_list<span class="token operator">-></span>next <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Set the next pointer to NULL.</span>
    <span class="token keyword">return</span> new_linked_list<span class="token punctuation">;</span> <span class="token comment">// Return the new node.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to insert a new node at the beginning of the list.</span>
<span class="token keyword">void</span> <span class="token function">insert_at_begin</span><span class="token punctuation">(</span>linked_list <span class="token operator">*</span><span class="token operator">*</span>head<span class="token punctuation">,</span> <span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>new_linked_list <span class="token operator">=</span> <span class="token function">create_linked_list</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Create a new node.</span>
    new_linked_list<span class="token operator">-></span>next <span class="token operator">=</span> <span class="token operator">*</span>head<span class="token punctuation">;</span> <span class="token comment">// Set the next pointer of the new node to the current head.</span>
    <span class="token operator">*</span>head <span class="token operator">=</span> new_linked_list<span class="token punctuation">;</span> <span class="token comment">// Set the new node as the head of the list.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to insert a new node at the end of the list.</span>
<span class="token keyword">void</span> <span class="token function">insert_at_end</span><span class="token punctuation">(</span>linked_list <span class="token operator">*</span><span class="token operator">*</span>head<span class="token punctuation">,</span> <span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>new_linked_list <span class="token operator">=</span> <span class="token function">create_linked_list</span><span class="token punctuation">(</span>data<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Create a new node.</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token operator">*</span>head <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token operator">*</span>head <span class="token operator">=</span> new_linked_list<span class="token punctuation">;</span> <span class="token comment">// If the list is empty, set the new node as the head.</span>
        <span class="token keyword">return</span> <span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    linked_list <span class="token operator">*</span>current <span class="token operator">=</span> <span class="token operator">*</span>head<span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>current<span class="token operator">-></span>next <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        current <span class="token operator">=</span> current<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// Traverse to the end of the list.</span>
    <span class="token punctuation">&#125;</span>
    current<span class="token operator">-></span>next <span class="token operator">=</span> new_linked_list<span class="token punctuation">;</span> <span class="token comment">// Insert the new node at the end of the list.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to delete a node from the list.</span>
<span class="token keyword">void</span> <span class="token function">delete_linked_list</span><span class="token punctuation">(</span>linked_list <span class="token operator">*</span><span class="token operator">*</span>head<span class="token punctuation">,</span> <span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>current <span class="token operator">=</span> <span class="token operator">*</span>head<span class="token punctuation">;</span>
    linked_list <span class="token operator">*</span>previous <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>current <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token keyword">if</span> <span class="token punctuation">(</span>current<span class="token operator">-></span>data <span class="token operator">==</span> data<span class="token punctuation">)</span> <span class="token comment">// If the node to be deleted is found.</span>
        <span class="token punctuation">&#123;</span>
            <span class="token keyword">if</span> <span class="token punctuation">(</span>previous <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
                <span class="token operator">*</span>head <span class="token operator">=</span> current<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// If the node to be deleted is the head, update the head.</span>
            <span class="token punctuation">&#125;</span><span class="token keyword">else</span><span class="token punctuation">&#123;</span>
                previous<span class="token operator">-></span>next <span class="token operator">=</span> current<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// Otherwise, bypass the node to be deleted.</span>
            <span class="token punctuation">&#125;</span>
            <span class="token function">free</span><span class="token punctuation">(</span>current<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Free the memory of the deleted node.</span>
            <span class="token keyword">return</span> <span class="token punctuation">;</span>
        <span class="token punctuation">&#125;</span>
        previous <span class="token operator">=</span> current<span class="token punctuation">;</span>
        current <span class="token operator">=</span> current<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// Move to the next node.</span>
    <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to print the list.</span>
<span class="token keyword">void</span> <span class="token function">print_list</span><span class="token punctuation">(</span>linked_list <span class="token operator">*</span>head<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>current <span class="token operator">=</span> head<span class="token punctuation">;</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>current <span class="token operator">!=</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token comment">// While there are nodes left.</span>
    <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d"</span><span class="token punctuation">,</span>current<span class="token operator">-></span>data<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the data of the current node.</span>
        current <span class="token operator">=</span> current<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// Move to the next node.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print a newline at the end.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Main function.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span><span class="token keyword">char</span> <span class="token keyword">const</span> <span class="token operator">*</span>argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
    linked_list <span class="token operator">*</span>head <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the head of the list to NULL.</span>

    <span class="token function">insert_at_begin</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Insert 1 at the beginning of the list.</span>
    <span class="token function">insert_at_begin</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Insert 2 at the beginning of the list.</span>
    <span class="token function">insert_at_begin</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Insert 3 at the beginning of the list.</span>

    <span class="token function">insert_at_end</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">4</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Insert 4 at the end of the list.</span>
    <span class="token function">insert_at_end</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">5</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Insert 5 at the end of the list.</span>

    <span class="token function">print_list</span><span class="token punctuation">(</span>head<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the list.</span>

    <span class="token function">delete_linked_list</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>head<span class="token punctuation">,</span><span class="token number">4</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Delete the node with data 4.</span>

    <span class="token function">print_list</span><span class="token punctuation">(</span>head<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the list after the deletion.</span>

    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Exit the program.</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-2-c语言实现dynamic-array"><a href="#1-2-c语言实现dynamic-array" class="headerlink" title="1-2.c语言实现dynamic_array"></a>1-2.c语言实现dynamic_array</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token comment">// Define a dynamic array structure that stores an array and its size.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span><span class="token operator">*</span> array<span class="token punctuation">;</span><span class="token comment">// Pointer to an integer array.</span>
    <span class="token class-name">size_t</span> size<span class="token punctuation">;</span> <span class="token comment">// Size of the array</span>
<span class="token punctuation">&#125;</span> dynamic_array<span class="token punctuation">;</span>

<span class="token comment">// Fuction to create a new dynamic array.</span>
dynamic_array<span class="token operator">*</span> <span class="token function">create_array</span> <span class="token punctuation">(</span><span class="token class-name">size_t</span> size<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    dynamic_array<span class="token operator">*</span> arr <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>dynamic_array<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Allocate memory for the dynamic array structure.</span>
    arr<span class="token operator">-></span>array <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span>size <span class="token operator">*</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Allocate memory for the integer array inside the structure.</span>
    arr<span class="token operator">-></span>size <span class="token operator">=</span> size<span class="token punctuation">;</span><span class="token comment">// Set the size of the array.</span>
    <span class="token keyword">return</span> arr<span class="token punctuation">;</span> <span class="token comment">// Return the pointer to the created dynamic array.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Fuction to read an element from dynamic array.</span>
<span class="token keyword">int</span> <span class="token function">read_array</span><span class="token punctuation">(</span>dynamic_array<span class="token operator">*</span> arr<span class="token punctuation">,</span><span class="token class-name">size_t</span> index<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>index<span class="token operator">&lt;</span>arr<span class="token operator">-></span>size<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span><span class="token comment">// If the index is within the bounds.</span>
        <span class="token keyword">return</span> arr<span class="token operator">-></span>array<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">;</span><span class="token comment">// Return the value at the specified index.</span>
    <span class="token punctuation">&#125;</span><span class="token keyword">else</span><span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error : index out of bounds: %d\n"</span><span class="token punctuation">,</span>index<span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Print error message.</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span><span class="token comment">// Return -1 to indicate an error.</span>
    <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Fuction to update an element from a dynamic array.</span>
<span class="token keyword">void</span> <span class="token function">update_array</span><span class="token punctuation">(</span>dynamic_array<span class="token operator">*</span> arr<span class="token punctuation">,</span> <span class="token class-name">size_t</span> index<span class="token punctuation">,</span> <span class="token keyword">int</span> value<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>index<span class="token operator">&lt;</span>arr<span class="token operator">-></span>size<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span><span class="token comment">// If the index is within the bounds.</span>
        arr<span class="token operator">-></span>array<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> value<span class="token punctuation">;</span><span class="token comment">// Update the value at the specified index.</span>
    <span class="token punctuation">&#125;</span><span class="token keyword">else</span><span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error : index out of bounds: %d\n"</span><span class="token punctuation">,</span>index<span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Print error message.</span>
    <span class="token punctuation">&#125;</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Fuction to delete a dynamic array.</span>
<span class="token keyword">void</span> <span class="token function">delete_array</span><span class="token punctuation">(</span>dynamic_array<span class="token operator">*</span> arr<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token function">free</span><span class="token punctuation">(</span>arr<span class="token operator">-></span>array<span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Free the memory allocated for the integer array.</span>
    <span class="token function">free</span><span class="token punctuation">(</span>arr<span class="token punctuation">)</span><span class="token punctuation">;</span><span class="token comment">// Free the memory allocated for the dynamic array structure.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// main </span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token comment">// Create a new dynamic array</span>
    dynamic_array<span class="token operator">*</span> arr <span class="token operator">=</span> <span class="token function">create_array</span><span class="token punctuation">(</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Update the 5th element in the array with the value 100000.</span>
    <span class="token function">update_array</span><span class="token punctuation">(</span>arr<span class="token punctuation">,</span><span class="token number">5</span><span class="token punctuation">,</span><span class="token number">100000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Read the 5th element from the array.</span>
    <span class="token keyword">int</span> value <span class="token operator">=</span> <span class="token function">read_array</span><span class="token punctuation">(</span>arr<span class="token punctuation">,</span><span class="token number">5</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Print the value.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"The value is : %d\n"</span><span class="token punctuation">,</span> value<span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Delete the dynamic array.</span>
    <span class="token function">delete_array</span><span class="token punctuation">(</span>arr<span class="token punctuation">)</span><span class="token punctuation">;</span>
    
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// The program executed successfully.</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-3-c语言实现hash"><a href="#1-3-c语言实现hash" class="headerlink" title="1-3 c语言实现hash"></a>1-3 c语言实现hash</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;string.h></span></span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">TABLE_SIZE</span> <span class="token expression"><span class="token number">10</span></span></span>

<span class="token comment">// Define the structure for the hash table.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token class-name">hash_table</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> size<span class="token punctuation">;</span> <span class="token comment">// Size of the hash table.</span>
    <span class="token keyword">int</span> num_elements<span class="token punctuation">;</span> <span class="token comment">// Number of elements in the hash table.</span>
    <span class="token keyword">char</span><span class="token operator">*</span><span class="token operator">*</span> keys<span class="token punctuation">;</span> <span class="token comment">// Array of keys.</span>
    <span class="token keyword">int</span><span class="token operator">*</span> values<span class="token punctuation">;</span> <span class="token comment">// Array of values.</span>
<span class="token punctuation">&#125;</span> HashTable<span class="token punctuation">;</span>

<span class="token comment">// Function to initialize the hash table.</span>
HashTable<span class="token operator">*</span> <span class="token function">init_table</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    HashTable<span class="token operator">*</span> table <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>HashTable<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for the hash table.</span>
    table<span class="token operator">-></span>size <span class="token operator">=</span> TABLE_SIZE<span class="token punctuation">;</span> <span class="token comment">// Set the size of the hash table.</span>
    table<span class="token operator">-></span>num_elements <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the number of elements to 0.</span>
    table<span class="token operator">-></span>keys <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span>table<span class="token operator">-></span>size <span class="token operator">*</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">char</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for the keys.</span>
    table<span class="token operator">-></span>values <span class="token operator">=</span> <span class="token function">malloc</span><span class="token punctuation">(</span>table<span class="token operator">-></span>size <span class="token operator">*</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for the values.</span>

    <span class="token comment">// Initialize all keys to NULL and all values to 0.</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> table<span class="token operator">-></span>size<span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span>
    <span class="token punctuation">&#123;</span>
        table<span class="token operator">-></span>keys<span class="token punctuation">[</span>i<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>
        table<span class="token operator">-></span>values<span class="token punctuation">[</span>i<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> table<span class="token punctuation">;</span> <span class="token comment">// Return the initialized hash table.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to compute the hash code for the given key.</span>
<span class="token keyword">int</span> <span class="token function">hash</span><span class="token punctuation">(</span><span class="token keyword">char</span><span class="token operator">*</span> key<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> hash <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>
    <span class="token keyword">for</span><span class="token punctuation">(</span><span class="token keyword">int</span> i <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> i <span class="token operator">&lt;</span> <span class="token function">strlen</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span> i<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        hash <span class="token operator">=</span> <span class="token punctuation">(</span>hash <span class="token operator">+</span> key<span class="token punctuation">[</span>i<span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token operator">%</span> TABLE_SIZE<span class="token punctuation">;</span> <span class="token comment">// Compute the hash code.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> hash<span class="token punctuation">;</span> <span class="token comment">// Return the hash code.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to insert a key-value pair into the hash table.</span>
<span class="token keyword">void</span> <span class="token function">put</span><span class="token punctuation">(</span>HashTable<span class="token operator">*</span> table<span class="token punctuation">,</span><span class="token keyword">char</span><span class="token operator">*</span> key<span class="token punctuation">,</span><span class="token keyword">int</span> value<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> index <span class="token operator">=</span> <span class="token function">hash</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Compute the hash code.</span>

    <span class="token comment">// Find an empty slot or a slot containing the same key.</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">!=</span> <span class="token constant">NULL</span> <span class="token operator">&amp;&amp;</span> <span class="token function">strcmp</span><span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">,</span>key<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span>
    <span class="token punctuation">&#123;</span>
        index <span class="token operator">=</span> <span class="token punctuation">(</span>index <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">%</span> table<span class="token operator">-></span>size<span class="token punctuation">;</span> <span class="token comment">// Linear probing.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>table<span class="token operator">-></span>values<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        table<span class="token operator">-></span>num_elements<span class="token operator">++</span><span class="token punctuation">;</span> <span class="token comment">// Increase the number of elements.</span>
    <span class="token punctuation">&#125;</span>
    table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> key<span class="token punctuation">;</span> <span class="token comment">// Store the key.</span>
    table<span class="token operator">-></span>values<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> value<span class="token punctuation">;</span> <span class="token comment">// Store the value.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to retrieve the value for a given key.</span>
<span class="token keyword">int</span> <span class="token function">get</span><span class="token punctuation">(</span>HashTable<span class="token operator">*</span> table<span class="token punctuation">,</span><span class="token keyword">char</span><span class="token operator">*</span> key<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> index <span class="token operator">=</span> <span class="token function">hash</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Compute the hash code.</span>

    <span class="token comment">// Find the slot containing the key.</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">!=</span> <span class="token constant">NULL</span> <span class="token operator">&amp;&amp;</span> <span class="token function">strcmp</span><span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">,</span>key<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span>
    <span class="token punctuation">&#123;</span>
        index <span class="token operator">=</span> <span class="token punctuation">(</span>index <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">%</span> table<span class="token operator">-></span>size<span class="token punctuation">;</span> <span class="token comment">// Linear probing.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span> <span class="token comment">// If the key is not found, return -1.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> table<span class="token operator">-></span>values<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Return the corresponding value.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to remove a key-value pair from the hash table.</span>
<span class="token keyword">void</span> <span class="token function">remove_key</span><span class="token punctuation">(</span>HashTable <span class="token operator">*</span>table<span class="token punctuation">,</span><span class="token keyword">char</span> <span class="token operator">*</span>key<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> index <span class="token operator">=</span> <span class="token function">hash</span><span class="token punctuation">(</span>key<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Compute the hash code.</span>

    <span class="token comment">// Find the slot containing the key.</span>
    <span class="token keyword">while</span> <span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">!=</span> <span class="token constant">NULL</span> <span class="token operator">&amp;&amp;</span> <span class="token function">strcmp</span><span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">,</span>key<span class="token punctuation">)</span> <span class="token operator">!=</span> <span class="token number">0</span><span class="token punctuation">)</span>
    <span class="token punctuation">&#123;</span>
        index <span class="token operator">=</span> <span class="token punctuation">(</span>index <span class="token operator">+</span> <span class="token number">1</span><span class="token punctuation">)</span> <span class="token operator">%</span> table<span class="token operator">-></span>size<span class="token punctuation">;</span> <span class="token comment">// Linear probing.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">if</span><span class="token punctuation">(</span>table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        <span class="token keyword">return</span> <span class="token punctuation">;</span> <span class="token comment">// If the key is not found, do nothing.</span>
    <span class="token punctuation">&#125;</span>
    table<span class="token operator">-></span>keys<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Remove the key.</span>
    table<span class="token operator">-></span>values<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Remove the value.</span>
    table<span class="token operator">-></span>num_elements<span class="token operator">--</span><span class="token punctuation">;</span> <span class="token comment">// Decrease the number of elements.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to compute the load factor of the hash table.</span>
<span class="token keyword">float</span> <span class="token function">load_factor</span><span class="token punctuation">(</span>HashTable<span class="token operator">*</span> table<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> <span class="token punctuation">(</span><span class="token keyword">float</span><span class="token punctuation">)</span>table<span class="token operator">-></span>num_elements <span class="token operator">/</span> <span class="token punctuation">(</span><span class="token keyword">float</span><span class="token punctuation">)</span>table<span class="token operator">-></span>size<span class="token punctuation">;</span> <span class="token comment">// Load factor is the ratio of the number of elements to the size of the hash table.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to get the number of elements in the hash table.</span>
<span class="token keyword">int</span> <span class="token function">num_elements</span><span class="token punctuation">(</span>HashTable<span class="token operator">*</span> table<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> table<span class="token operator">-></span>num_elements<span class="token punctuation">;</span> <span class="token comment">// Return the number of elements.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Main function.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    HashTable<span class="token operator">*</span> table <span class="token operator">=</span> <span class="token function">init_table</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Initialize a new hash table.</span>

    <span class="token comment">// Insert three key-value pairs into the hash table.</span>
    <span class="token function">put</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key1"</span><span class="token punctuation">,</span> <span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">put</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key2"</span><span class="token punctuation">,</span> <span class="token number">20</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">put</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key3"</span><span class="token punctuation">,</span> <span class="token number">30</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Print the number of elements and the load factor.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Number of elements: %d\n"</span><span class="token punctuation">,</span> <span class="token function">num_elements</span><span class="token punctuation">(</span>table<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Load factor: %.2f\n"</span><span class="token punctuation">,</span> <span class="token function">load_factor</span><span class="token punctuation">(</span>table<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Print the value of each key.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Value of key1: %d\n"</span><span class="token punctuation">,</span> <span class="token function">get</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key1"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Value of key2: %d\n"</span><span class="token punctuation">,</span> <span class="token function">get</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key2"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Value of key3: %d\n"</span><span class="token punctuation">,</span> <span class="token function">get</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key3"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Remove a key from the hash table.</span>
    <span class="token function">remove_key</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key2"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Print the number of elements and the load factor after removing a key.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Number of elements after removing a key: %d\n"</span><span class="token punctuation">,</span> <span class="token function">num_elements</span><span class="token punctuation">(</span>table<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Load factor after removing a key: %.2f\n"</span><span class="token punctuation">,</span> <span class="token function">load_factor</span><span class="token punctuation">(</span>table<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token comment">// Print the value of the removed key.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Value of key2 after removing it: %d\n"</span><span class="token punctuation">,</span> <span class="token function">get</span><span class="token punctuation">(</span>table<span class="token punctuation">,</span> <span class="token string">"key2"</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Exit the program.</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-4-c语言实现stack"><a href="#1-4-c语言实现stack" class="headerlink" title="1-4 c语言实现stack"></a>1-4 c语言实现stack</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">STACK_SIZE</span> <span class="token expression"><span class="token number">100</span> </span><span class="token comment">// Define the maximum size of the stack.</span></span>

<span class="token comment">// Definition of the Stack structure.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> 
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> data<span class="token punctuation">[</span>STACK_SIZE<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Array to hold the stack elements.</span>
    <span class="token keyword">int</span> top<span class="token punctuation">;</span> <span class="token comment">// Index of the top element in the stack.</span>
<span class="token punctuation">&#125;</span> Stack<span class="token punctuation">;</span>

<span class="token comment">// Function to initialize a stack.</span>
<span class="token keyword">void</span> <span class="token function">init_stack</span><span class="token punctuation">(</span>Stack <span class="token operator">*</span>stack<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    stack<span class="token operator">-></span>top <span class="token operator">=</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span> <span class="token comment">// Set the index of the top element to -1 indicating an empty stack.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to check if the stack is empty.</span>
<span class="token keyword">int</span> <span class="token function">is_empty</span><span class="token punctuation">(</span>Stack <span class="token operator">*</span>stack<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> stack<span class="token operator">-></span>top <span class="token operator">==</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span> <span class="token comment">// Returns 1 if stack is empty, 0 otherwise.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to check if the stack is full.</span>
<span class="token keyword">int</span> <span class="token function">is_full</span><span class="token punctuation">(</span>Stack <span class="token operator">*</span>stack<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> stack<span class="token operator">-></span>top <span class="token operator">==</span> STACK_SIZE <span class="token operator">-</span> <span class="token number">1</span><span class="token punctuation">;</span> <span class="token comment">// Returns 1 if stack is full, 0 otherwise.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to push a new element onto the stack.</span>
<span class="token keyword">void</span> <span class="token function">push</span><span class="token punctuation">(</span>Stack <span class="token operator">*</span>stack<span class="token punctuation">,</span><span class="token keyword">int</span> x<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_full</span><span class="token punctuation">(</span>stack<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: Stack is full\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the stack is full, print an error message and return.</span>
        <span class="token keyword">return</span> <span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>

    stack<span class="token operator">-></span>top<span class="token operator">++</span><span class="token punctuation">;</span> <span class="token comment">// Increment the top index.</span>
    stack<span class="token operator">-></span>data<span class="token punctuation">[</span>stack<span class="token operator">-></span>top<span class="token punctuation">]</span> <span class="token operator">=</span> x<span class="token punctuation">;</span> <span class="token comment">// Insert the new element at the new top index.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to pop an element from the stack.</span>
<span class="token keyword">int</span> <span class="token function">pop</span><span class="token punctuation">(</span>Stack <span class="token operator">*</span>stack<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_empty</span><span class="token punctuation">(</span>stack<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: Stack is empty\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the stack is empty, print an error message and return -1.</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>

    <span class="token keyword">int</span> x <span class="token operator">=</span> stack<span class="token operator">-></span>data<span class="token punctuation">[</span>stack<span class="token operator">-></span>top<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Store the top element.</span>
    stack<span class="token operator">-></span>top<span class="token operator">--</span><span class="token punctuation">;</span> <span class="token comment">// Decrement the top index.</span>
    <span class="token keyword">return</span> x<span class="token punctuation">;</span> <span class="token comment">// Return the popped element.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to return the top element of the stack without removing it.</span>
<span class="token keyword">int</span> <span class="token function">peek</span><span class="token punctuation">(</span>Stack<span class="token operator">*</span> stack<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_empty</span><span class="token punctuation">(</span>stack<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: Stack is empty\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the stack is empty, print an error message and return -1.</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> stack<span class="token operator">-></span>data<span class="token punctuation">[</span>stack<span class="token operator">-></span>top<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Return the top element.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// main function.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span><span class="token keyword">char</span> <span class="token keyword">const</span> <span class="token operator">*</span>argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    Stack s<span class="token punctuation">;</span> <span class="token comment">// Declare a stack.</span>
    <span class="token function">init_stack</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the stack.</span>
    <span class="token function">push</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Push 1 onto the stack.</span>
    <span class="token function">push</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Push 2 onto the stack.</span>
    <span class="token function">push</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">,</span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Push 3 onto the stack.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span><span class="token function">pop</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Pop the top element from the stack and print it.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span><span class="token function">peek</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the top element of the stack.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span><span class="token function">is_empty</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print 1 if the stack is empty, 0 otherwise.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span><span class="token function">is_full</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>s<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print 1 if the stack is full, 0 otherwise.</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Exit the program.</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-5-c语言实现graph"><a href="#1-5-c语言实现graph" class="headerlink" title="1-5 c语言实现graph"></a>1-5 c语言实现graph</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">MAX_NODES</span> <span class="token expression"><span class="token number">100</span> </span><span class="token comment">// Define the maximum number of nodes in the graph.</span></span>

<span class="token comment">// Define the Node structure.</span>
<span class="token keyword">struct</span> <span class="token class-name">Node</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> data<span class="token punctuation">;</span> <span class="token comment">// Value of the node.</span>
    <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>next<span class="token punctuation">;</span> <span class="token comment">// Pointer to the next node in the adjacency list.</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">;</span>

<span class="token comment">// Define the Graph structure.</span>
<span class="token keyword">struct</span> <span class="token class-name">Graph</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> numNodes<span class="token punctuation">;</span> <span class="token comment">// Number of nodes in the graph.</span>
    <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>adjLists<span class="token punctuation">[</span>MAX_NODES<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Array of pointers to the adjacency lists of the nodes.</span>
<span class="token punctuation">&#125;</span><span class="token punctuation">;</span>

<span class="token comment">// Function to create a new Graph.</span>
<span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span><span class="token function">createGraph</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span>graph <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Graph</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for a new graph.</span>
    graph<span class="token operator">-></span>numNodes <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the number of nodes to 0.</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> index <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> index <span class="token operator">&lt;</span> MAX_NODES<span class="token punctuation">;</span>index<span class="token operator">++</span><span class="token punctuation">)</span><span class="token punctuation">&#123;</span>
        graph<span class="token operator">-></span>adjLists<span class="token punctuation">[</span>index<span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span>  <span class="token comment">// Initialize all adjacency lists to NULL.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> graph<span class="token punctuation">;</span> <span class="token comment">// Return the new graph.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to add a Node to a Graph.</span>
<span class="token keyword">void</span> <span class="token function">addNode</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span>graph<span class="token punctuation">,</span><span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>node <span class="token operator">=</span> <span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Node</span><span class="token operator">*</span><span class="token punctuation">)</span><span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Node</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for a new node.</span>
    node<span class="token operator">-></span>data <span class="token operator">=</span> data<span class="token punctuation">;</span> <span class="token comment">// Set the node's data.</span>
    node<span class="token operator">-></span>next <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the next pointer to NULL.</span>
    graph<span class="token operator">-></span>adjLists<span class="token punctuation">[</span>graph<span class="token operator">-></span>numNodes<span class="token operator">++</span><span class="token punctuation">]</span> <span class="token operator">=</span> node<span class="token punctuation">;</span> <span class="token comment">// Add the node to the graph and increment the number of nodes.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to add an Edge to a Graph.</span>
<span class="token keyword">void</span> <span class="token function">addEdge</span><span class="token punctuation">(</span><span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span>graph<span class="token punctuation">,</span><span class="token keyword">int</span> src<span class="token punctuation">,</span><span class="token keyword">int</span> dest<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>srcNode <span class="token operator">=</span> graph<span class="token operator">-></span>adjLists<span class="token punctuation">[</span>src<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Find the source node.</span>
    <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>destNode <span class="token operator">=</span> graph<span class="token operator">-></span>adjLists<span class="token punctuation">[</span>dest<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Find the destination node.</span>
    srcNode<span class="token operator">-></span>next <span class="token operator">=</span> destNode<span class="token punctuation">;</span> <span class="token comment">// Add the destination node to the source node's adjacency list.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// main function to test the graph functions.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span><span class="token keyword">char</span> <span class="token keyword">const</span> <span class="token operator">*</span>argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">struct</span> <span class="token class-name">Graph</span> <span class="token operator">*</span>graph <span class="token operator">=</span> <span class="token function">createGraph</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Create a new graph.</span>
    <span class="token function">addNode</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add node 0 to the graph.</span>
    <span class="token function">addNode</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add node 1 to the graph.</span>
    <span class="token function">addNode</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add node 2 to the graph.</span>
    <span class="token function">addNode</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add node 3 to the graph.</span>
    <span class="token function">addEdge</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add an edge from node 0 to node 1.</span>
    <span class="token function">addEdge</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add an edge from node 0 to node 2.</span>
    <span class="token function">addEdge</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add an edge from node 1 to node 2.</span>
    <span class="token function">addEdge</span><span class="token punctuation">(</span>graph<span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">,</span><span class="token number">3</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add an edge from node 2 to node 3.</span>

    <span class="token comment">// Print the adjacency lists of the nodes.</span>
    <span class="token keyword">for</span> <span class="token punctuation">(</span><span class="token keyword">int</span> index <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span>index <span class="token operator">&lt;</span> graph<span class="token operator">-></span>numNodes<span class="token punctuation">;</span> index<span class="token operator">++</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token keyword">struct</span> <span class="token class-name">Node</span> <span class="token operator">*</span>curr_node <span class="token operator">=</span> graph<span class="token operator">-></span>adjLists<span class="token punctuation">[</span>index<span class="token punctuation">]</span><span class="token punctuation">;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Adjacency list for node %d:"</span><span class="token punctuation">,</span>index<span class="token punctuation">)</span><span class="token punctuation">;</span>
        <span class="token keyword">while</span> <span class="token punctuation">(</span>curr_node<span class="token punctuation">)</span>
        <span class="token punctuation">&#123;</span>
            <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d -> "</span><span class="token punctuation">,</span>curr_node<span class="token operator">-></span>data<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the node's data.</span>
            curr_node <span class="token operator">=</span> curr_node<span class="token operator">-></span>next<span class="token punctuation">;</span> <span class="token comment">// Move to the next node in the adjacency list.</span>
        <span class="token punctuation">&#125;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"NULL\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// End of the adjacency list.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-6-c语言实现prefect-brinay-tree"><a href="#1-6-c语言实现prefect-brinay-tree" class="headerlink" title="1-6 c语言实现prefect_brinay_tree"></a>1-6 c语言实现prefect_brinay_tree</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token comment">// Define the TreeNode structure.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> <span class="token class-name">TreeNode</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> data<span class="token punctuation">;</span> <span class="token comment">// Value of the node.</span>
    <span class="token keyword">struct</span> <span class="token class-name">TreeNode</span> <span class="token operator">*</span>left<span class="token punctuation">;</span> <span class="token comment">// Pointer to the left child.</span>
    <span class="token keyword">struct</span> <span class="token class-name">TreeNode</span> <span class="token operator">*</span>right<span class="token punctuation">;</span> <span class="token comment">// Pointer to the right child.</span>
<span class="token punctuation">&#125;</span> TreeNode<span class="token punctuation">;</span>

<span class="token comment">// Function to create a new TreeNode.</span>
TreeNode<span class="token operator">*</span> <span class="token function">createnode</span><span class="token punctuation">(</span><span class="token keyword">int</span> data<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    TreeNode <span class="token operator">*</span>node <span class="token operator">=</span> <span class="token punctuation">(</span>TreeNode<span class="token operator">*</span><span class="token punctuation">)</span> <span class="token function">malloc</span><span class="token punctuation">(</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span>TreeNode<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Allocate memory for a new node.</span>
    node<span class="token operator">-></span>data <span class="token operator">=</span> data<span class="token punctuation">;</span> <span class="token comment">// Set the node's data.</span>
    node<span class="token operator">-></span>left <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the left child pointer to NULL.</span>
    node<span class="token operator">-></span>right <span class="token operator">=</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the right child pointer to NULL.</span>

    <span class="token keyword">return</span> node<span class="token punctuation">;</span> <span class="token comment">// Return the new node.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to create a perfect binary tree from a sorted array.</span>
TreeNode<span class="token operator">*</span> <span class="token function">createPrefectBinaryTree</span><span class="token punctuation">(</span><span class="token keyword">int</span> <span class="token operator">*</span>array<span class="token punctuation">,</span><span class="token keyword">int</span> start<span class="token punctuation">,</span><span class="token keyword">int</span> end<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>start <span class="token operator">></span> end<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token keyword">return</span> <span class="token constant">NULL</span><span class="token punctuation">;</span> <span class="token comment">// If the array is empty, return NULL.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">int</span> mid <span class="token operator">=</span> <span class="token punctuation">(</span>start <span class="token operator">+</span> end<span class="token punctuation">)</span><span class="token operator">/</span><span class="token number">2</span><span class="token punctuation">;</span> <span class="token comment">// Find the middle element of the array.</span>
    TreeNode <span class="token operator">*</span>node <span class="token operator">=</span> <span class="token function">createnode</span><span class="token punctuation">(</span>array<span class="token punctuation">[</span>mid<span class="token punctuation">]</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Create a new node with the middle element.</span>
    node<span class="token operator">-></span>left <span class="token operator">=</span> <span class="token function">createPrefectBinaryTree</span><span class="token punctuation">(</span>array<span class="token punctuation">,</span>start<span class="token punctuation">,</span>mid<span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Recursively create the left subtree.</span>
    node<span class="token operator">-></span>right <span class="token operator">=</span> <span class="token function">createPrefectBinaryTree</span><span class="token punctuation">(</span>array<span class="token punctuation">,</span>mid<span class="token operator">+</span><span class="token number">1</span><span class="token punctuation">,</span>end<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Recursively create the right subtree.</span>
    <span class="token keyword">return</span> node<span class="token punctuation">;</span> <span class="token comment">// Return the root node of the tree.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to traverse a binary tree in pre-order (root, left, right).</span>
<span class="token keyword">void</span> <span class="token function">preOrderTraveral</span><span class="token punctuation">(</span>TreeNode<span class="token operator">*</span> root<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span>root <span class="token operator">==</span> <span class="token constant">NULL</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token keyword">return</span><span class="token punctuation">;</span> <span class="token comment">// If the tree is empty, return.</span>
    <span class="token punctuation">&#125;</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span>root<span class="token operator">-></span>data<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Print the root node's data.</span>
    <span class="token function">preOrderTraveral</span><span class="token punctuation">(</span>root<span class="token operator">-></span>left<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Recursively traverse the left subtree.</span>
    <span class="token function">preOrderTraveral</span><span class="token punctuation">(</span>root<span class="token operator">-></span>right<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Recursively traverse the right subtree.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// main function to test the binary tree functions.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span> <span class="token keyword">char</span> <span class="token keyword">const</span> <span class="token operator">*</span>argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> array<span class="token punctuation">[</span><span class="token punctuation">]</span> <span class="token operator">=</span> <span class="token punctuation">&#123;</span><span class="token number">1</span><span class="token punctuation">,</span><span class="token number">2</span><span class="token punctuation">,</span><span class="token number">3</span><span class="token punctuation">,</span><span class="token number">4</span><span class="token punctuation">,</span><span class="token number">5</span><span class="token punctuation">,</span><span class="token number">6</span><span class="token punctuation">,</span><span class="token number">7</span><span class="token punctuation">,</span><span class="token number">8</span><span class="token punctuation">,</span><span class="token number">9</span><span class="token punctuation">&#125;</span><span class="token punctuation">;</span> <span class="token comment">// Sorted array to be converted to a binary tree.</span>
    <span class="token keyword">int</span> size <span class="token operator">=</span> <span class="token keyword">sizeof</span><span class="token punctuation">(</span>array<span class="token punctuation">)</span><span class="token operator">/</span><span class="token keyword">sizeof</span><span class="token punctuation">(</span><span class="token keyword">int</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Size of the array.</span>
    TreeNode <span class="token operator">*</span>root <span class="token operator">=</span> <span class="token function">createPrefectBinaryTree</span><span class="token punctuation">(</span>array<span class="token punctuation">,</span><span class="token number">0</span><span class="token punctuation">,</span>size<span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Create a perfect binary tree from the array.</span>
    <span class="token function">preOrderTraveral</span><span class="token punctuation">(</span>root<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Traverse the binary tree in pre-order and print the nodes.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"\n"</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
    <span class="token keyword">return</span> <span class="token number">0</span><span class="token punctuation">;</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

<h2 id="1-7-c语言实现queue"><a href="#1-7-c语言实现queue" class="headerlink" title="1-7 c语言实现queue"></a>1-7 c语言实现queue</h2><pre class="line-numbers language-c" data-language="c"><code class="language-c"><span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdio.h></span></span>
<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">include</span> <span class="token string">&lt;stdlib.h></span></span>

<span class="token macro property"><span class="token directive-hash">#</span><span class="token directive keyword">define</span> <span class="token macro-name">QUEUE_SIZE</span> <span class="token expression"><span class="token number">100</span> </span><span class="token comment">// Define the maximum size of the queue.</span></span>

<span class="token comment">// Definition of the Queue structure.</span>
<span class="token keyword">typedef</span> <span class="token keyword">struct</span> 
<span class="token punctuation">&#123;</span>
    <span class="token keyword">int</span> data<span class="token punctuation">[</span>QUEUE_SIZE<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Array to hold the queue elements.</span>
    <span class="token keyword">int</span> head<span class="token punctuation">;</span> <span class="token comment">// Index of the front element in the queue.</span>
    <span class="token keyword">int</span> tail<span class="token punctuation">;</span> <span class="token comment">// Index of the rear element in the queue.</span>
<span class="token punctuation">&#125;</span>Queue<span class="token punctuation">;</span>

<span class="token comment">// Function to initialize a queue.</span>
<span class="token keyword">void</span> <span class="token function">init_queue</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    queue<span class="token operator">-></span>head <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Set the index of the front element to 0.</span>
    queue<span class="token operator">-></span>tail <span class="token operator">=</span> <span class="token number">0</span><span class="token punctuation">;</span> <span class="token comment">// Set the index of the rear element to 0.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to check if the queue is empty.</span>
<span class="token keyword">int</span> <span class="token function">is_empty</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> queue<span class="token operator">-></span>head <span class="token operator">==</span> queue<span class="token operator">-></span>tail<span class="token punctuation">;</span> <span class="token comment">// Returns 1 if queue is empty, 0 otherwise.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to check if the queue is full.</span>
<span class="token keyword">int</span> <span class="token function">is_full</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">return</span> queue<span class="token operator">-></span>head <span class="token operator">==</span> QUEUE_SIZE<span class="token punctuation">;</span> <span class="token comment">// Returns 1 if queue is full, 0 otherwise.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to add an element to the end of the queue.</span>
<span class="token keyword">void</span> <span class="token function">enqueue</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">,</span> <span class="token keyword">int</span> value<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_full</span><span class="token punctuation">(</span>queue<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: queue is full.\n "</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the queue is full, print an error message and return.</span>
        <span class="token keyword">return</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    queue<span class="token operator">-></span>data<span class="token punctuation">[</span>queue<span class="token operator">-></span>tail<span class="token punctuation">]</span> <span class="token operator">=</span> value<span class="token punctuation">;</span> <span class="token comment">// Insert the new element at the end of the queue.</span>
    queue<span class="token operator">-></span>tail<span class="token operator">++</span><span class="token punctuation">;</span> <span class="token comment">// Increment the tail index.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to remove an element from the front of the queue.</span>
<span class="token keyword">int</span> <span class="token function">dequeue</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_empty</span><span class="token punctuation">(</span>queue<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: queue is empty.\n "</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the queue is empty, print an error message and return -1.</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    
    <span class="token keyword">int</span> value <span class="token operator">=</span> queue<span class="token operator">-></span>data<span class="token punctuation">[</span>queue<span class="token operator">-></span>head<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Store the front element.</span>
    queue<span class="token operator">-></span>head<span class="token operator">++</span><span class="token punctuation">;</span> <span class="token comment">// Increment the head index.</span>
    <span class="token keyword">return</span> value<span class="token punctuation">;</span> <span class="token comment">// Return the removed element.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// Function to return the front element of the queue without removing it.</span>
<span class="token keyword">int</span> <span class="token function">peek</span><span class="token punctuation">(</span>Queue <span class="token operator">*</span>queue<span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
    <span class="token keyword">if</span> <span class="token punctuation">(</span><span class="token function">is_empty</span><span class="token punctuation">(</span>queue<span class="token punctuation">)</span><span class="token punctuation">)</span> <span class="token punctuation">&#123;</span>
        <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"Error: queue is empty.\n "</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// If the queue is empty, print an error message and return -1.</span>
        <span class="token keyword">return</span> <span class="token operator">-</span><span class="token number">1</span><span class="token punctuation">;</span>
    <span class="token punctuation">&#125;</span>
    <span class="token keyword">return</span> queue<span class="token operator">-></span>data<span class="token punctuation">[</span>queue<span class="token operator">-></span>head<span class="token punctuation">]</span><span class="token punctuation">;</span> <span class="token comment">// Return the front element.</span>
<span class="token punctuation">&#125;</span>

<span class="token comment">// main function to test the queue.</span>
<span class="token keyword">int</span> <span class="token function">main</span><span class="token punctuation">(</span><span class="token keyword">int</span> argc<span class="token punctuation">,</span> <span class="token keyword">char</span> <span class="token keyword">const</span> <span class="token operator">*</span>argv<span class="token punctuation">[</span><span class="token punctuation">]</span><span class="token punctuation">)</span>
<span class="token punctuation">&#123;</span>
    Queue q<span class="token punctuation">;</span> <span class="token comment">// Declare a queue.</span>
    <span class="token function">init_queue</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>q<span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Initialize the queue.</span>
    <span class="token function">enqueue</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>q<span class="token punctuation">,</span><span class="token number">5</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add 5 to the queue.</span>
    <span class="token function">enqueue</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>q<span class="token punctuation">,</span><span class="token number">10</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Add 10 to the queue.</span>
    <span class="token function">printf</span><span class="token punctuation">(</span><span class="token string">"%d\n"</span><span class="token punctuation">,</span> <span class="token function">dequeue</span><span class="token punctuation">(</span><span class="token operator">&amp;</span>q<span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span> <span class="token comment">// Remove the front element from the queue and print it.</span>
<span class="token punctuation">&#125;</span><span aria-hidden="true" class="line-numbers-rows"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span></code></pre>

