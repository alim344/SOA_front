<template>
  <div class="app-layout">
    <aside class="fixed-sidebar">
      <div class="sidebar-top">

        <div class="sidebar-header">
            <span class="logo-text">Tour<span class="highlight">City</span></span>
          <div class="instructor-tag">Guide</div>
        </div>

        
        <nav class="nav-buttons">
          <button class="nav-btn" @click="setActiveTab('allTours')">
            <span class="btn-label">All Tours</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('allBlogs')">
            <span class="btn-label">All Blogs</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('myTours')">
            <span class="btn-label">My Tours</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('createTour')">
            <span class="btn-label">Create Tour</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('profile')">
            <span class="btn-label">Profile</span>
          </button>
          
        
        </nav>
      </div>

      <div class="sidebar-footer">
        <button class="logout-btn">
          <span class="btn-label">Log out</span>
        </button>
      </div>
    </aside>

    <main class="content-area">
     <AllTours v-if="activeTab === 'allTours'" @view-tour="handleViewTour" />
    <TourDetail v-else-if="activeTab === 'tourDetail'" :tour-id="selectedTourId" @back="setActiveTab('allTours')" />

      <div v-else-if="activeTab === 'allBlogs'" class="content-panel">
        <h2>All Blogs</h2>
        <p>Read our latest travel blogs...</p>
      </div>
      
      
      <MyTours v-else-if="activeTab === 'myTours'" @manage-keypoints="handleManageKeyPoints" />
      <ManageKeyPoints v-else-if="activeTab === 'manageKeyPoints'" :tour-id="selectedTourId" @back="setActiveTab('myTours')" />

      <CreateTour v-else-if="activeTab === 'createTour'" @tour-created="onTourCreated" />
            
      <div v-else-if="activeTab === 'profile'" class="content-panel">
        <h2>Profile</h2>
        <p>Your guide profile settings...</p>
      </div>
  </main>
  </div>
</template>

<script>
import AllTours from './Guide/AllTours.vue';
import TourDetail from './TourDetail.vue';
import ManageKeyPoints from './Guide/ManageKeyPoints.vue';
import MyTours from './Guide/MyTours.vue';
import CreateTour from './Guide/CreateTour.vue';
export default {
 
  components:{
    AllTours,TourDetail,ManageKeyPoints,MyTours,CreateTour
  },
  data(){
    return{
      activeTab:'allTours',
      selectedTourId:null,
    };
  },
   methods: {
    setActiveTab(tab) {
      this.activeTab = tab;
    },
    handleViewTour(tourId) {
      this.selectedTourId = tourId;
      this.activeTab = 'tourDetail';
    },
    handleManageKeyPoints(tourId) {
      this.selectedTourId = tourId;
      this.activeTab = 'manageKeyPoints';
    },
     onTourCreated() {
       this.setActiveTab('createTour');
     }
     
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background: #f0f2f5;
  font-family: 'Segoe UI', 'Inter', system-ui, -apple-system, sans-serif;
}

.fixed-sidebar {
  width: 200px;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fc 100%);
  border-right: 1px solid #e9ecef;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px 16px 32px 20px;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.sidebar-top {
  flex: 1;
}

.sidebar-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 40px;
  padding-bottom: 16px;
  border-bottom: 2px solid #eef2f6;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #1a2c3e;
  letter-spacing: -0.3px;
}

.logo-text .highlight {
  color: #2d6a4f;
  font-weight: 800;
}

.instructor-tag {
  background: #e9ecef;
  padding: 4px 10px;
  border-radius: 40px;
  font-size: 12px;
  font-weight: 600;
  color: #2d6a4f;
  background: #eaf4e8;
  letter-spacing: 0.3px;
}

.nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #2c3e44;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  font-family: inherit;
}

.nav-btn .btn-icon {
  font-size: 20px;
  width: 28px;
  text-align: center;
}

.nav-btn .btn-label {
  flex: 1;
}

.nav-btn:hover {
  background: #eef2fa;
  color: #1b4d3e;
  transform: translateX(2px);
}

.nav-btn:active {
  background: #e2e8f0;
  transform: scale(0.98);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #e9edf2;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #fff1f0;
  border: 1px solid #ffe0db;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 500;
  color: #bc4e2c;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-family: inherit;
}

.logout-btn .btn-icon {
  font-size: 20px;
}

.logout-btn .btn-label {
  font-weight: 600;
}

.logout-btn:hover {
  background: #ffe6e2;
  border-color: #ffb4a2;
  color: #9b3a1c;
}

.content-area {
  flex: 1;           /* Takes all remaining width */
  min-width: 0;      /* Prevents flex overflow issues */
  padding: 20px 20px;
  background: #f7f9fe;
  overflow-y: auto;
}



</style>