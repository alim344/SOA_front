<template>
  <div class="app-layout">
    <aside class="fixed-sidebar">
      <div class="sidebar-top">

        <div class="sidebar-header">
            <span class="logo-text">Tour<span class="highlight">City</span></span>
          <div class="instructor-tag">Tourist</div>
        </div>

        
        <nav class="nav-buttons">
          <button class="nav-btn" @click="setActiveTab('allTours')">
            <span class="btn-label">All Tours</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('allBlogs')">
            <span class="btn-label">All Blogs</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('myBlogs')">
            <span class="btn-label">My Blogs</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('profile')">
            <span class="btn-label">Profile</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('simulator')">
            <span class="btn-label">Simulator</span>
          </button>
          <button class="nav-btn" @click="setActiveTab('activeTour')">
            <span class="btn-label">Active Tour</span>
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

      <AllBlogs  v-else-if="activeTab === 'allBlogs'" class="content-panel">
        <h2>All Blogs</h2>
        <p>Read our latest travel blogs...</p>
      </AllBlogs >
      
      
      <MyBlogs v-else-if="activeTab === 'myBlogs'" class="content-panel">
        <h2>My Blogs</h2>
        <p>My travel blogs...</p>
      </MyBlogs>
      
      <ProfileTourist v-else-if="activeTab === 'profile'" />

      <PositionSimulator v-else-if="activeTab === 'simulator'" />
      <ActiveTour
        v-else-if="activeTab === 'activeTour'"
        :tour-id="4"
        :tourist-id="currentUserId"
        @back="setActiveTab('allTours')"
      />
  </main>
  </div>
</template>

<script>
import AllTours from './Guide/AllTours.vue';
import TourDetail from './TourDetail.vue';
import PositionSimulator from './Tourist/PositionSimulator.vue';
import AllBlogs from './AllBlogs.vue'
import MyBlogs from './MyBlogs.vue'
import ProfileTourist from "./Tourist/ProfileTourist.vue";
import Profile from "./Guide/Profile.vue";
import ActiveTour from './Tourist/ActiveTour.vue';

export default {
 
  components:{

    AllTours,TourDetail,PositionSimulator, AllBlogs, MyBlogs,
    Profile, ProfileTourist,ActiveTour
  },
  data(){
    return{
      activeTab:'allTours',
      selectedTourId:null,
      currentUserId: Number(localStorage.getItem('userId'))
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
     goBack() {                          
      this.setActiveTab('allTours');
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
  flex: 1;           
  min-width: 0;      
  padding: 20px 20px;
  background: #f7f9fe;
  overflow-y: auto;
}



</style>