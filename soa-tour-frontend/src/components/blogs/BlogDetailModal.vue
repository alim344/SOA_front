<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <button class="back-btn" @click="$emit('close')">← Back</button>
        <div v-if="isOwner" class="owner-actions">
          <button class="action-btn edit-btn" @click="showEditForm = true">Edit</button>
          <button class="action-btn del-btn" @click="showDeleteConfirm = true">Delete</button>
        </div>
      </div>

      <div class="blog-content">
        <div v-if="blog.images && blog.images.length" class="img-gallery">
          <img v-for="(img, i) in blog.images" :key="i" :src="img" class="gallery-img" alt="" />
        </div>

        <div class="blog-meta">
          <span class="author-chip">{{ blog.author_email }}</span>
          <!-- Follow blog author -->
          <button
            v-if="blog.author_email !== currentEmail"
            class="follow-btn"
            :class="{ following: authorFollowing }"
            :disabled="authorFollowLoading"
            @click="toggleFollow(blog.author_email, 'author')"
          >
            {{ authorFollowLoading ? '…' : authorFollowing ? 'Following' : '+ Follow' }}
          </button>
          <span class="date">{{ formatDate(blog.created_at) }}</span>
        </div>

        <h1 class="blog-title">{{ blog.title }}</h1>
        <p class="blog-desc">{{ blog.description }}</p>

        <button class="like-btn" :class="{ liked: blog.liked_by_me }" @click="$emit('like', blog.id)">
          <span class="heart">{{ blog.liked_by_me ? '♥' : '♡' }}</span>
          {{ blog.like_count }} {{ blog.like_count === 1 ? 'like' : 'likes' }}
        </button>
      </div>

      <div class="divider" />

      <div class="comments-section">
        <h3 class="comments-title">Comments</h3>

        <div v-if="commentsLoading" class="cstate"><div class="spinner" /></div>
        <div v-else-if="commentsError" class="cstate error">{{ commentsError }}</div>
        <div v-else-if="comments.length === 0" class="cstate muted">No comments yet. Be the first!</div>

        <div v-else class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment">
            <div class="comment-header">
              <span class="comment-author">{{ c.author_email }}</span>
              <!-- Follow commenter -->
              <button
                v-if="c.author_email !== currentEmail"
                class="follow-btn-sm"
                :class="{ following: followingMap[c.author_email] }"
                :disabled="followLoadingMap[c.author_email]"
                @click="toggleFollow(c.author_email, 'comment')"
              >
                {{ followLoadingMap[c.author_email] ? '…' : followingMap[c.author_email] ? 'Following' : '+ Follow' }}
              </button>
              <span class="comment-date">{{ formatDate(c.updated_at) }}</span>
            </div>

            <template v-if="editingCommentId === c.id">
              <textarea v-model="editingCommentText" class="comment-input" rows="2" />
              <div class="comment-edit-actions">
                <button class="save-comment-btn" :disabled="savingComment" @click="saveEditComment(c)">
                  {{ savingComment ? '…' : 'Save' }}
                </button>
                <button class="cancel-comment-btn" @click="editingCommentId = null">Cancel</button>
              </div>
            </template>
            <template v-else>
              <p class="comment-text">{{ c.text }}</p>
              <div v-if="c.author_email === currentEmail" class="comment-actions">
                <button class="caction edit" @click="startEditComment(c)">Edit</button>
                <button class="caction del" @click="deleteComment(c.id)">Delete</button>
              </div>
            </template>
          </div>
        </div>

        <div class="add-comment">
          <textarea v-model="newCommentText" class="comment-input" rows="2" placeholder="Write a comment…" />
          <button class="post-btn" :disabled="!newCommentText.trim() || postingComment" @click="postComment">
            {{ postingComment ? '…' : 'Post' }}
          </button>
        </div>
      </div>
    </div>

    <BlogFormModal
      v-if="showEditForm"
      title="Edit Blog"
      :initial="blog"
      @save="handleUpdate"
      @close="showEditForm = false"
    />

    <div v-if="showDeleteConfirm" class="confirm-overlay" @click.self="showDeleteConfirm = false">
      <div class="confirm-box">
        <h3>Delete blog?</h3>
        <p>This cannot be undone. All comments will be removed.</p>
        <div class="confirm-actions">
          <button class="cancel-btn" @click="showDeleteConfirm = false">Cancel</button>
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
import BlogFormModal from './BlogFormModal.vue'

export default {
  name: 'BlogDetailModal',
  components: { BlogFormModal },
  props: {
    blog: { type: Object, required: true },
    currentEmail: { type: String, default: '' },
  },
  emits: ['close', 'like', 'updated', 'deleted'],

  data() {
    return {
      comments: [],
      commentsLoading: false,
      commentsError: null,
      newCommentText: '',
      postingComment: false,
      editingCommentId: null,
      editingCommentText: '',
      savingComment: false,
      showEditForm: false,
      showDeleteConfirm: false,
      deleteLoading: false,
      // follow state for blog author
      authorFollowing: false,
      authorFollowLoading: false,
      // follow state for commenters — keyed by email
      followingMap: {},
      followLoadingMap: {},
    }
  },

  computed: {
    isOwner() {
      return this.blog.author_email === this.currentEmail
    },
  },

  mounted() {
    this.fetchComments()
    if (this.blog.author_email && this.blog.author_email !== this.currentEmail) {
      this.checkFollowing(this.blog.author_email, 'author')
    }
  },

  methods: {
    formatDate(dt) {
      if (!dt) return ''
      return new Date(dt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    },

    async fetchComments() {
      this.commentsLoading = true
      this.commentsError = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://localhost:8000/api/blogs/${this.blog.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.comments = response.data
        // check follow status for each unique commenter
        const emails = [...new Set(
          this.comments
            .map(c => c.author_email)
            .filter(e => e && e !== this.currentEmail)
        )]
        emails.forEach(email => this.checkFollowing(email, 'comment'))
      } catch (err) {
        this.commentsError = err.response?.data?.detail || 'Failed to load comments'
      } finally {
        this.commentsLoading = false
      }
    },

    async checkFollowing(email, type) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `http://localhost:8000/follower/is-following/${this.currentEmail}/${email}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (type === 'author') {
          this.authorFollowing = response.data
        } else {
          this.followingMap = { ...this.followingMap, [email]: response.data }
        }
      } catch {
        // ignore
      }
    },

    async toggleFollow(email, type) {
      if (type === 'author') {
        this.authorFollowLoading = true
      } else {
        this.followLoadingMap = { ...this.followLoadingMap, [email]: true }
      }

      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          'http://localhost:8000/follower/follow',
          { followee_mail: email },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const newState = response.data && typeof response.data.following === 'boolean'
          ? response.data.following
          : type === 'author' ? !this.authorFollowing : !this.followingMap[email]

        if (type === 'author') {
          this.authorFollowing = newState
        } else {
          this.followingMap = { ...this.followingMap, [email]: newState }
        }
      } catch (err) {
        alert(err.response?.data || 'Failed to follow/unfollow')
      } finally {
        if (type === 'author') {
          this.authorFollowLoading = false
        } else {
          this.followLoadingMap = { ...this.followLoadingMap, [email]: false }
        }
      }
    },

    async postComment() {
      if (!this.newCommentText.trim()) return
      this.postingComment = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          `http://localhost:8000/api/blogs/${this.blog.id}/comments`,
          { text: this.newCommentText.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.comments.push(response.data)
        this.newCommentText = ''
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to post comment')
      } finally {
        this.postingComment = false
      }
    },

    startEditComment(c) {
      this.editingCommentId = c.id
      this.editingCommentText = c.text
    },

    async saveEditComment(c) {
      this.savingComment = true
      try {
        const token = localStorage.getItem('token')
        await axios.put(
          `http://localhost:8000/api/blogs/${this.blog.id}/comments/${c.id}`,
          { text: this.editingCommentText.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const idx = this.comments.findIndex(x => x.id === c.id)
        if (idx !== -1) this.comments[idx].text = this.editingCommentText.trim()
        this.editingCommentId = null
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to update comment')
      } finally {
        this.savingComment = false
      }
    },

    async deleteComment(commentId) {
      if (!confirm('Delete this comment?')) return
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/blogs/${this.blog.id}/comments/${commentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.comments = this.comments.filter(c => c.id !== commentId)
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete comment')
      }
    },

    async handleUpdate(data) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.put(`http://localhost:8000/api/blogs/${this.blog.id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.$emit('updated', response.data)
        this.showEditForm = false
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to update blog')
      }
    },

    async doDelete() {
      this.deleteLoading = true
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:8000/api/blogs/${this.blog.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.$emit('deleted', this.blog.id)
        this.showDeleteConfirm = false
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete blog')
      } finally {
        this.deleteLoading = false
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 100;
  padding: 20px 16px;
  overflow-y: auto;
}

.modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  margin: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,0.22);
  font-family: 'DM Sans', sans-serif;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #f0f2f5;
}

.back-btn {
  background: none;
  border: none;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  color: #6b7a8d;
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.15s;
}

.back-btn:hover { color: #1a2c3e; }
.owner-actions { display: flex; gap: 8px; }

.action-btn {
  padding: 7px 16px;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.edit-btn { background: #eef2fa; color: #2d6a4f; }
.del-btn { background: #fff0f0; color: #e53e3e; }

.blog-content { padding: 24px 28px; }

.img-gallery {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  border-radius: 14px;
  overflow: hidden;
  max-height: 320px;
}

.gallery-img { flex: 1; object-fit: cover; min-width: 0; }

.blog-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }

.author-chip {
  font-size: 0.78rem;
  font-weight: 600;
  background: #eaf4e8;
  color: #2d6a4f;
  padding: 3px 10px;
  border-radius: 20px;
}

.date { font-size: 0.78rem; color: #a0aec0; margin-left: auto; }

.blog-title {
  font-family: 'Lora', serif;
  font-size: 1.6rem;
  font-weight: 600;
  color: #1a2c3e;
  line-height: 1.3;
  margin-bottom: 14px;
}

.blog-desc {
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.7;
  margin-bottom: 20px;
  white-space: pre-wrap;
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: #f7f9fe;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7a8d;
  cursor: pointer;
  transition: all 0.15s;
}

.like-btn.liked { background: #fff0f0; border-color: #ffb3b3; color: #e53e3e; }
.like-btn:hover { background: #fff0f0; border-color: #ffb3b3; color: #e53e3e; }
.heart { font-size: 1.1rem; }

/* Follow buttons */
.follow-btn {
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1.5px solid #2d6a4f;
  background: transparent;
  color: #2d6a4f;
  cursor: pointer;
  transition: all 0.15s;
}

.follow-btn:hover { background: #2d6a4f; color: #fff; }
.follow-btn.following { background: #2d6a4f; color: #fff; }
.follow-btn.following:hover { background: #e53e3e; border-color: #e53e3e; }
.follow-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.follow-btn-sm {
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'DM Sans', sans-serif;
  padding: 2px 8px;
  border-radius: 20px;
  border: 1.5px solid #2d6a4f;
  background: transparent;
  color: #2d6a4f;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.follow-btn-sm:hover { background: #2d6a4f; color: #fff; }
.follow-btn-sm.following { background: #2d6a4f; color: #fff; }
.follow-btn-sm.following:hover { background: #e53e3e; border-color: #e53e3e; }
.follow-btn-sm:disabled { opacity: 0.6; cursor: not-allowed; }

.divider { height: 1px; background: #f0f2f5; margin: 0 28px; }

.comments-section { padding: 20px 28px 28px; }

.comments-title {
  font-family: 'Lora', serif;
  font-size: 1.1rem;
  color: #1a2c3e;
  margin-bottom: 16px;
}

.cstate { display: flex; align-items: center; justify-content: center; padding: 24px 0; font-size: 0.88rem; }
.cstate.muted { color: #a0aec0; }
.cstate.error { color: #e53e3e; }

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e9ecef;
  border-top-color: #2d6a4f;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.comment-list { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }

.comment { background: #f7f9fe; border-radius: 12px; padding: 12px 16px; }

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.comment-author { font-size: 0.8rem; font-weight: 600; color: #2d6a4f; }
.comment-date { font-size: 0.75rem; color: #a0aec0; margin-left: auto; }
.comment-text { font-size: 0.9rem; color: #4a5568; line-height: 1.5; }

.comment-actions { display: flex; gap: 8px; margin-top: 8px; }

.caction {
  font-size: 0.75rem;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}

.caction.edit { color: #2d6a4f; }
.caction.edit:hover { background: #eaf4e8; }
.caction.del { color: #e53e3e; }
.caction.del:hover { background: #fff0f0; }

.comment-edit-actions { display: flex; gap: 8px; margin-top: 6px; }

.save-comment-btn, .cancel-comment-btn {
  padding: 5px 14px;
  border: none;
  border-radius: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.save-comment-btn { background: #2d6a4f; color: #fff; }
.cancel-comment-btn { background: #f0f2f5; color: #4a5568; }

.add-comment { display: flex; gap: 10px; align-items: flex-end; }

.comment-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem;
  color: #1a2c3e;
  background: #fafbfc;
  resize: none;
  transition: border 0.15s;
}

.comment-input:focus { outline: none; border-color: #2d6a4f; background: #fff; }

.post-btn {
  padding: 10px 20px;
  background: #2d6a4f;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.post-btn:hover { background: #1b4d3e; }
.post-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.confirm-box h3 { font-family: 'Lora', serif; font-size: 1.2rem; color: #1a2c3e; margin-bottom: 8px; }
.confirm-box p { font-size: 0.88rem; color: #6b7a8d; margin-bottom: 24px; }
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