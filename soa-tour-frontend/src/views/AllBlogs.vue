<template>
  <div class="blogs-root">
    <div class="page-header">
      <div>
        <h1 class="page-title">All Blogs</h1>
        <p class="page-sub">From people you follow</p>
      </div>
      <button class="create-btn" @click="showCreate = true">
        <span class="plus">＋</span> New Blog
      </button>
    </div>

    <div v-if="loading" class="state-box">
      <div class="spinner" />
      <p>Loading blogs…</p>
    </div>

    <div v-else-if="error" class="state-box error-box">
      <span class="state-icon">⚠️</span>
      <p>{{ error }}</p>
      <button class="retry-btn" @click="fetchBlogs">Retry</button>
    </div>

    <div v-else-if="blogs.length === 0" class="state-box">
      <span class="state-icon">📭</span>
      <p>No blogs yet. Follow authors or create your own!</p>
    </div>

    <div v-else class="feed">
      <BlogCard
        v-for="blog in blogs"
        :key="blog.id"
        :blog="blog"
        :current-email="currentEmail"
        @like="handleLike"
        @open="openBlog"
      />
    </div>

    <BlogFormModal
      v-if="showCreate"
      title="New Blog"
      @save="handleCreate"
      @close="showCreate = false"
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
  </div>
</template>

<script>
import axios from 'axios'
import BlogCard from '../components/blogs/BlogCard.vue'
import BlogFormModal from '../components/blogs/BlogFormModal.vue'
import BlogDetailModal from '../components/blogs/BlogDetailModal.vue'

export default {
  name: 'AllBlogs',
  components: { BlogCard, BlogFormModal, BlogDetailModal },

  data() {
    return {
      blogs: [],
      loading: false,
      error: null,
      showCreate: false,
      selectedBlog: null,
      currentEmail: localStorage.getItem('userEmail') || '',
    }
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
        const response = await axios.get('http://localhost:8000/api/blogs/', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.blogs = response.data
      } catch (err) {
        this.error = err.response?.data?.detail || 'Failed to load blogs'
      } finally {
        this.loading = false
      }
    },

    openBlog(blog) {
      this.selectedBlog = blog
    },

    async handleLike(blogId) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(`http://localhost:8000/api/blogs/${blogId}/like`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const idx = this.blogs.findIndex(b => b.id === blogId)
        if (idx !== -1) {
          this.blogs[idx].liked_by_me = response.data.liked
          this.blogs[idx].like_count = response.data.like_count
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
        this.blogs.unshift(response.data)
        this.showCreate = false
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to create blog')
      }
    },

    onBlogUpdated(updated) {
      const idx = this.blogs.findIndex(b => b.id === updated.id)
      if (idx !== -1) this.blogs.splice(idx, 1, updated)
      this.selectedBlog = updated
    },

    onBlogDeleted(id) {
      this.blogs = this.blogs.filter(b => b.id !== id)
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
  line-height: 1.1;
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

.create-btn:hover {
  background: #1b4d3e;
  transform: translateY(-1px);
}

.plus { font-size: 1.1rem; line-height: 1; }

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

.feed {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>