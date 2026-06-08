<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">{{ title }}</h2>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form">
        <label class="field">
          <span class="label">Title</span>
          <input
            v-model="form.title"
            type="text"
            class="input"
            placeholder="Give your blog a title…"
            maxlength="120"
          />
        </label>

        <label class="field">
          <span class="label">Description</span>
          <textarea
            v-model="form.description"
            class="textarea"
            rows="6"
            placeholder="Share your story…"
          />
        </label>

        <div class="field">
          <span class="label">Images (URLs, one per line)</span>
          <textarea
            v-model="imagesRaw"
            class="textarea"
            rows="3"
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <!-- Preview thumbnails -->
        <div v-if="imageUrls.length" class="preview-row">
          <img
            v-for="(url, i) in imageUrls"
            :key="i"
            :src="url"
            class="preview-img"
            alt=""
          />
        </div>

        <p v-if="validationError" class="val-error">{{ validationError }}</p>

        <div class="form-actions">
          <button class="cancel-btn" @click="$emit('close')">Cancel</button>
          <button class="save-btn" :disabled="saving" @click="submit">
            {{ saving ? 'Saving…' : 'Publish' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BlogFormModal',
  props: {
    title: { type: String, default: 'New Blog' },
    initial: { type: Object, default: null },
  },
  emits: ['save', 'close'],

  data() {
    return {
      form: {
        title: this.initial?.title || '',
        description: this.initial?.description || '',
      },
      imagesRaw: (this.initial?.images || []).join('\n'),
      saving: false,
      validationError: '',
    }
  },

  computed: {
    imageUrls() {
      return this.imagesRaw
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('http'))
    },
  },

  methods: {
    async submit() {
      this.validationError = ''
      if (!this.form.title.trim()) {
        this.validationError = 'Title is required.'
        return
      }
      if (!this.form.description.trim()) {
        this.validationError = 'Description is required.'
        return
      }
      this.saving = true
      try {
        this.$emit('save', {
          title: this.form.title.trim(),
          description: this.form.description.trim(),
          images: this.imageUrls,
        })
      } finally {
        this.saving = false
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600&family=DM+Sans:wght@400;500;600&display=swap');

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 60px rgba(0,0,0,0.2);
  font-family: 'DM Sans', sans-serif;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}

.modal-title {
  font-family: 'Lora', serif;
  font-size: 1.4rem;
  color: #1a2c3e;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #a0aec0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color 0.15s;
}

.close-btn:hover { color: #1a2c3e; }

.form {
  padding: 20px 28px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input, .textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
  color: #1a2c3e;
  background: #fafbfc;
  transition: border 0.15s;
  resize: vertical;
  box-sizing: border-box;
}

.input:focus, .textarea:focus {
  outline: none;
  border-color: #2d6a4f;
  background: #fff;
}

.preview-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.val-error {
  font-size: 0.84rem;
  color: #e53e3e;
  padding: 8px 12px;
  background: #fff5f5;
  border-radius: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 4px;
}

.cancel-btn {
  padding: 11px 22px;
  background: #f0f2f5;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
}

.save-btn {
  padding: 11px 28px;
  background: #2d6a4f;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.18s;
}

.save-btn:hover { background: #1b4d3e; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
</style> 