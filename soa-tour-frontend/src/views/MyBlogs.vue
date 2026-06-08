<template>
  <div class="blogs-root">
    <div class="page-header">
      <div>
        <h1 class="page-title">My Blogs</h1>
        <p class="page-sub">Your published posts</p>
      </div>
      <button class="create-btn" @click="showCreate = true">
        <span class="plus">＋</span> New Blog
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>Loading…</p>
    </div>

    <div v-else-if="error" class="state-box error-box">
      <span class="state-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchBlogs">Retry</button>
    </div>

    <div v-else-if="myBlogs.length === 0" class="state-box">
      <span class="state-icon">✍️</span>
      <p>You haven't written anything yet. Start your first blog!</p>
    </div>

    <div v-else class="feed">
      <BlogCard
        v-for="blog in myBlogs"
        :key="blog.id"
        :blog="blog"
        :current-email="currentEmail"
        :show-actions="true"
        @like="handleLike"
        @open="openBlog"
        @edit="startEdit"
        @delete="confirmDelete"
      />
    </div>

    <BlogFormModal
      v-if="showCreate"
      title="New Blog"
      @save="handleCreate"
      @close="showCreate = false"
    />

    <BlogFormModal
      v-if="editingBlog"
      title="Edit Blog"
      :initial="editingBlog"
      @save="handleUpdate"
      @close="editingBlog = null"
    />

    <BlogDetailModal
      v-if="selectedBlog"
      :blog="selectedBlog"
      :current-email="currentEmail"
      @like="handleLike"
      @close="selectedBlog = null"
      @updated="onBlogUpdated"
      @deleted="onBlogDeleted"
    />

    <div v-if="deletingId" class="modal-overlay" @click.self="deletingId = null">
      <div class="confirm-box">
        <h3>Delete blog?</h3>
        <p>This action cannot be undone. All comments will also be removed.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="deletingId = null">Cancel</button>
          <button class="danger-btn" :disabled="deleteLoading" @click="doDelete">
            {{ deleteLoading ? 'Deleting…' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import BlogCard from '../components/blogs/BlogCard.vue'
import BlogFormModal from '../components/blogs/BlogFormModal.vue'
import BlogDetailModal from '../components/blogs/BlogDetailModal.vue'

export default {
  name: 'MyBlogs',
  components: { BlogCard, BlogFormModal, BlogDetailModal },

  data() {
    return {
      allBlogs: [],
      loading: false,
      error: null,
      showCreate: false,
      editingBlog: null,
      selectedBlog: null,
      deletingId: null,
      deleteLoading: false,
      currentEmail: localStorage.getItem('userEmail') || '',
    }
  },

  computed: {
    myBlogs() {
      return this.allBlogs.filter(b => b.author_email === this.currentEmail)
    },
  },

  mounted() {
    this.fetchBlogs()
  },

  methods: {
    async fetchBlogs() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:8000/api/blogs/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.allBlogs = response.data
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to load blogs'
      } finally {
        this.loading = false
      }
    },

    openBlog(blog) { this.selectedBlog = blog },
    startEdit(blog) { this.editingBlog = blog },
    confirmDelete(id) { this.deletingId = id },

    async doDelete() {
      this.deleteLoading = true
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/blogs/${this.deletingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.allBlogs = this.allBlogs.filter(b => b.id !== this.deletingId)
        this.deletingId = null
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete blog')
      } finally {
        this.deleteLoading = false
      }
    },

    async handleLike(blogId) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(`http://localhost:8000/api/blogs/${blogId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const idx = this.allBlogs.findIndex(b => b.id === blogId)
        if (idx !== -1) {
          this.allBlogs[idx].liked_by_me = response.data.liked
          this.allBlogs[idx].like_count = response.data.like_count
        }
        if (this.selectedBlog?.id === blogId) {
          this.selectedBlog.liked_by_me = response.data.liked
          this.selectedBlog.like_count = response.data.like_count
        }
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to like blog')
      }
    },

    async handleCreate(data) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post('http://localhost:8000/api/blogs/', data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.allBlogs.unshift(response.data)
        this.showCreate = false
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to create blog')
      }
    },

    async handleUpdate(data) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.put(`http://localhost:8000/api/blogs/${this.editingBlog.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const idx = this.allBlogs.findIndex(b => b.id === response.data.id)
        if (idx !== -1) this.allBlogs.splice(idx, 1, response.data)
        this.editingBlog = null
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to update blog')
      }
    },

    onBlogUpdated(updated) {
      const idx = this.allBlogs.findIndex(b => b.id === updated.id)
      if (idx !== -1) this.allBlogs.splice(idx, 1, updated)
      this.selectedBlog = updated
    },

    onBlogDeleted(id) {
      this.allBlogs = this.allBlogs.filter(b => b.id !== id)
      this.selectedBlog = null
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');

.blogs-root {
  font-family: 'DM Sans', sans-serif;
  max-width: 780px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-title {
  font-family: 'Lora', serif;
  font-size: 2rem;
  font-weight: 600;
  color: #1a2c3e;
}

.page-sub {
  font-size: 0.85rem;
  color: #8a9bb0;
  margin-top: 4px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #2d6a4f;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s, transform 0.15s;
}

.create-btn:hover { background: #1b4d3e; transform: translateY(-1px); }
.plus { font-size: 1.1rem; }

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
  color: #8a9bb0;
  font-size: 0.95rem;
}

.state-icon { font-size: 2.5rem; }
.error-box { color: #bc4e2c; }

.retry-btn {
  padding: 8px 20px;
  background: #bc4e2c;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e9ecef;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.feed { display: flex; flex-direction: column; gap: 20px; }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.confirm-box {
  background: #fff;
  border-radius: 18px;
  padding: 32px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
}

.confirm-box h3 {
  font-family: 'Lora', serif;
  font-size: 1.25rem;
  color: #1a2c3e;
  margin-bottom: 8px;
}

.confirm-box p { font-size: 0.9rem; color: #6b7a8d; margin-bottom: 24px; }
.confirm-actions { display: flex; gap: 12px; justify-content: flex-end; }

.cancel-btn {
  padding: 10px 20px;
  background: #f0f2f5;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  cursor: pointer;
  color: #4a5568;
}

.danger-btn {
  padding: 10px 20px;
  background: #e53e3e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  cursor: pointer;
}

.danger-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>