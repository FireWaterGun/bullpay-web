# Sneat Bootstrap Theme - สรุปการใช้งาน

เอกสารสรุปเชิงลึกสำหรับธีม Sneat Bootstrap HTML Admin Template และการใช้งานใน React (bull-pay)

## 📋 ภาพรวมธีม

### คุณสมบัติหลัก
- **HTML Admin Template**: ธีมแดชบอร์ดแอดมินที่ใช้ Bootstrap 5
- **Responsive Design**: รองรับการแสดงผลทุกอุปกรณ์
- **Multi-layout Support**: รองรับหลายรูปแบบเลย์เอาต์
- **RTL Support**: รองรับการแสดงผลแบบ Right-to-Left
- **Light/Dark Theme**: รองรับธีมสว่างและมืด
- **Template Customizer**: เครื่องมือปรับแต่งธีมแบบเรียลไทม์

### เวอร์ชันและการรองรับ
- **Bootstrap**: 5.x
- **jQuery**: Required
- **Browser Support**: ทุก modern browsers
- **Framework Integration**: รองรับ Laravel, ASP.NET Core, Django

## 📁 โครงสร้างไฟล์ (Folder Structure)

### โครงสร้างหลัก
```
📦 sneat-theme/
├── 📂 assets/                      # Static & Generated assets
│   ├── 📂 css/                     # Demo & Example styles
│   ├── 📂 img/                     # Images (jpeg/png/svg)
│   ├── 📂 js/                      # JS files (demos, pages, apps)
│   │   ├── 📄 main.js              # Template Main JS (Init)
│   │   ├── 📄 config.js            # Config file for customization
│   │   └── 📄 dashboards-analytics.js
│   ├── 📂 json/                    # Fake data (search, apps, tables)
│   └── 📂 vendor/                  # Generated vendor assets
├── 📂 html/                        # Template HTML files
│   ├── 📂 vertical-menu-template/  # With Customizer
│   ├── 📂 horizontal-menu-template/
│   └── 📂 front-pages/
├── 📂 html-starter/                # Starter files (minimal libs)
├── 📂 js/                          # Core JS (ES6) files
│   ├── 📄 menu.js                  # Core Menu
│   ├── 📄 template-customizer.js   # Customizer Plugin
│   └── 📄 helpers.js               # Helper methods
├── 📂 scss/                        # Core SCSS source
│   ├── 📂 _bootstrap-extended/     # Extended Bootstrap styles
│   ├── 📂 _components/             # Custom components
│   ├── 📂 _custom-variables/       # Custom variables
│   └── 📄 core.scss                # Main core file
└── 📂 libs/                        # Third-party libraries
```

## ⚙️ การกำหนดค่า (Configuration)

### config.js - ไฟล์หลักการกำหนดค่า

```javascript
window.config = {
  colors: {
    primary: '#7367F0',    // สีหลัก (ใช้ hex เท่านั้น)
    secondary: '#82868b',
    success: '#28c76f',
    // ... สีอื่นๆ
  },
  colors_label: {
    primary: '#7367f01a',  // สีสำหรับ label/badge
    // ... สีอื่นๆ
  },
  enableMenuLocalStorage: true  // เก็บสถานะเมนูใน localStorage
};

// TemplateCustomizer Settings
window.templateCustomizer = new TemplateCustomizer({
  displayCustomizer: true,           // แสดง customizer
  lang: 'en',                       // ภาษาเริ่มต้น
  defaultTheme: 'light',            // 'light' | 'dark' | 'system'
  defaultSkin: 0,                   // 0 (Default) | 1 (Bordered)
  defaultContentLayout: 'compact',  // 'compact' | 'wide'
  defaultMenuCollapsed: false,      // ยุบเมนูโดยเริ่มต้น
  defaultNavbarType: 'sticky',      // 'sticky' | 'static' | 'hidden'
  defaultTextDir: 'ltr',           // 'ltr' | 'rtl'
  defaultFooterFixed: false,        // Footer แบบ fixed
  controls: ['color', 'theme', 'skins', 'layoutCollapsed', ...]
});
```

### การตั้งค่าใน HTML
```html
<html lang="en" 
      class="layout-navbar-fixed layout-menu-fixed" 
      dir="ltr" 
      data-skin="default" 
      data-bs-theme="light"
      data-assets-path="../../assets/" 
      data-template="vertical-menu-template">
```

## 🚀 Quick Start Template

### โครงสร้าง HTML พื้นฐาน
```html
<!DOCTYPE html>
<html lang="en" class="layout-navbar-fixed layout-menu-fixed" 
      dir="ltr" data-skin="default" data-bs-theme="light">
<head>
  <!-- Meta & Title -->
  <meta charset="utf-8" />
  <title>Dashboard</title>
  
  <!-- Favicon -->
  <link rel="icon" href="../../assets/img/favicon/favicon.ico" />
  
  <!-- Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:..." />
  
  <!-- Icons -->
  <link rel="stylesheet" href="../../assets/vendor/fonts/iconify-icons.css" />
  <link rel="stylesheet" href="../../assets/vendor/fonts/fontawesome.css" />
  
  <!-- Core CSS -->
  <link rel="stylesheet" href="../../assets/vendor/css/core.css" />
  <link rel="stylesheet" href="../../assets/css/demo.css" />
  
  <!-- Vendors CSS -->
  <link rel="stylesheet" href="../../assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css" />
  
  <!-- Page CSS -->
  <link rel="stylesheet" href="../../assets/vendor/css/pages/page-auth.css" />
  
  <!-- Helpers (ต้องใส่ใน head) -->
  <script src="../../assets/vendor/js/helpers.js"></script>
  <script src="../../assets/vendor/js/template-customizer.js"></script>
  <script src="../../assets/js/config.js"></script>
</head>
<body>
  <!-- Content -->
  <h1>Hello, world!</h1>
  
  <!-- Core JS -->
  <script src="../../assets/vendor/libs/jquery/jquery.js"></script>
  <script src="../../assets/vendor/libs/popper/popper.js"></script>
  <script src="../../assets/vendor/js/bootstrap.js"></script>
  <script src="../../assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js"></script>
  <script src="../../assets/vendor/libs/hammer/hammer.js"></script>
  <script src="../../assets/vendor/js/menu.js"></script>
  
  <!-- Main JS -->
  <script src="../../assets/js/main.js"></script>
</body>
</html>
```

## 🎨 Layout System

### รูปแบบ Layout หลัก

#### 1. Vertical Layout (แนวตั้ง)
```html
<div class="layout-wrapper layout-content-navbar">
  <div class="layout-container">
    <!-- Menu (Sidebar) -->
    <aside id="layout-menu" class="layout-menu menu-vertical menu bg-menu-theme">
      <!-- Navigation Menu -->
    </aside>
    
    <!-- Layout Page -->
    <div class="layout-page">
      <!-- Navbar -->
      <nav class="layout-navbar navbar navbar-expand-xl bg-navbar-theme">
        <!-- Top Navigation -->
      </nav>
      
      <!-- Content Wrapper -->
      <div class="content-wrapper">
        <!-- Content -->
        <div class="container-xxl flex-grow-1 container-p-y">
          <!-- Page Content -->
        </div>
        
        <!-- Footer -->
        <footer class="content-footer footer bg-footer-theme">
          <!-- Footer Content -->
        </footer>
      </div>
    </div>
  </div>
  
  <!-- Overlay & Mobile Menu Toggle -->
  <div class="layout-overlay layout-menu-toggle"></div>
  <div class="drag-target"></div>
</div>
```

### Layout Options (CSS Classes)
| Class | คำอธิบาย |
|-------|----------|
| `layout-menu-collapsed` | ยุบเมนูใน desktop (>= 1200px) |
| `layout-menu-fixed` | เมนูแบบ fixed position |
| `layout-navbar-fixed` | navbar แบบ fixed position |
| `layout-footer-fixed` | footer แบบ fixed position |
| `layout-content-navbar` | เลย์เอาต์แบบมี navbar |

## 🧩 Dependencies & Libraries

### Core Dependencies (จำเป็น)
```json
{
  "bootstrap": "5.x",
  "@popperjs/core": "^2.x",
  "hammerjs": "^2.x",
  "jquery": "^3.x",
  "perfect-scrollbar": "^1.x"
}
```

### การจัดการไอคอน
```json
{
  "@fortawesome/fontawesome-free": "Font Awesome icons",
  "@iconify/json": "Iconify icons",
  "flag-icons": "Country flags"
}
```

### UI Components & Plugins
```json
{
  "apexcharts": "Charts",
  "datatables.net": "Data tables",
  "fullcalendar": "Calendar",
  "sweetalert2": "Modal alerts",
  "select2": "Enhanced select",
  "flatpickr": "Date picker",
  "quill": "Rich text editor",
  "dropzone": "File upload"
}
```

## 🎨 Utility Classes

### สี (Colors)
```css
/* Background Colors */
.bg-light, .bg-lighter, .bg-lightest

/* Text Colors */
.text-light, .text-lighter, .text-lightest

/* Invertible Colors (auto flip in dark mode) */
.invert-text-white, .invert-bg-dark
```

### ขนาดและระยะห่าง
```css
/* Fixed Pixel Sizes */
.h-px-{20|30|40|50|75|100|150|200|250|300|350|400|500}
.w-px-{20|30|40|50|75|100|150|200|250|300|350|400|500}

/* Container Utilities */
.container-p-x, .container-p-y  /* padding */
.container-m-nx, .container-m-ny /* negative margin */
```

### Text & Typography
```css
/* Font Sizes */
.fs-tiny, .fs-big, .fs-large, .fs-xlarge, .fs-xxlarge

/* Font Weight */
.fw-semibold

/* Text Transform */
.rotate-{0|90|180|270}     /* clockwise */
.rotate-n{90|180|270}      /* counter-clockwise */
.scaleX-n1, .scaleY-n1     /* flip text */
```

### Borders & Misc
```css
/* Borders */
.border-light, .border-transparent
.row-bordered              /* add borders to columns */

/* Cursor */
.cursor-pointer, .cursor-move

/* Opacity */
.opacity-{25|50|75|100}
```

## 🖥️ ใช้งานใน React (bull-pay)

### การตั้งค่าใน index.html
```html
<!-- โหลด Core Assets -->
<link rel="stylesheet" href="/assets/vendor/css/core.css" />
<link rel="stylesheet" href="/assets/css/demo.css" />
<script src="/assets/vendor/js/helpers.js" defer></script>
<script src="/assets/js/config.js" defer></script>

<!-- โหลด Bootstrap & Dependencies -->
<script src="/assets/vendor/libs/jquery/jquery.js" defer></script>
<script src="/assets/vendor/js/bootstrap.js" defer></script>
<script src="/assets/vendor/js/menu.js" defer></script>
<script src="/assets/js/main.js" defer></script>
```

### Component Pattern ใน React
```jsx
// Card Component
function MyCard({ title, children }) {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-3">{title}</h5>
        {children}
      </div>
    </div>
  );
}

// Button with Sneat styling
function SneatButton({ variant = "primary", size = "", children, ...props }) {
  return (
    <button 
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### การใช้งาน Charts
```jsx
import { useEffect } from 'react';

function DashboardCharts() {
  useEffect(() => {
    // รอให้ ApexCharts โหลด
    const initCharts = () => {
      if (window.ApexCharts && window.renderDashboardAnalytics) {
        window.renderDashboardAnalytics();
      }
    };
    
    // ลองทุก 50ms จนกว่าจะพร้อม
    const interval = setInterval(() => {
      if (window.ApexCharts) {
        initCharts();
        clearInterval(interval);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div>
      <div id="totalRevenueChart"></div>
      <div id="orderChart"></div>
    </div>
  );
}
```

## 🎯 Best Practices

### 1. การโหลด Assets
- โหลดสคริปต์ของธีมใน `index.html` เท่านั้น
- ใช้ `window` global objects ใน React components
- ห้าม import jQuery/Bootstrap ใน components

### 2. การใช้ CSS Classes
- ใช้ class ของ Sneat ตามตัวอย่าง HTML เดิม
- ใช้ utility classes แทนการเขียน CSS custom
- รักษาโครงสร้าง layout wrapper > container > content

### 3. การจัดการ State
- ใช้ `localStorage` สำหรับ theme preferences
- Sync การตั้งค่ากับ `<html>` attributes
- จัดการ responsive behavior ด้วย CSS classes

### 4. การปรับแต่ง
- แก้ไขใน `config.js` สำหรับสีและการตั้งค่า
- ใช้ CSS custom properties สำหรับ theme variables
- เพิ่ม custom CSS ใน demo.css หรือไฟล์แยก

## 🔧 Template Customizer

### การเปิดใช้งาน
```javascript
window.templateCustomizer = new TemplateCustomizer({
  displayCustomizer: true,    // แสดงปุ่ม customizer
  controls: [                 // ควบคุมที่แสดง
    'color',                  // เปลี่ยนสี
    'theme',                  // light/dark
    'skins',                  // default/bordered
    'layoutCollapsed',        // ยุบเมนู
    'contentLayout',          // compact/wide
    'rtl'                     // ทิศทาง LTR/RTL
  ]
});
```

### การปิดใช้งาน Customizer
```html
<!-- ใช้เทมเพลตแบบ no-customizer -->
<script>
  window.templateCustomizer = new TemplateCustomizer({
    displayCustomizer: false
  });
</script>
```

## 📱 Responsive & Mobile

### Breakpoints
- **XS**: < 576px (Mobile portrait)
- **SM**: ≥ 576px (Mobile landscape) 
- **MD**: ≥ 768px (Tablet)
- **LG**: ≥ 992px (Desktop)
- **XL**: ≥ 1200px (Large desktop)
- **XXL**: ≥ 1400px (Extra large)

### Mobile Menu Behavior
```javascript
// Desktop (≥ xl): toggle collapse
if (window.matchMedia('(min-width: 1200px)').matches) {
  document.documentElement.classList.toggle('layout-menu-collapsed');
} 
// Mobile (< xl): toggle offcanvas
else {
  document.documentElement.classList.toggle('layout-menu-expanded');
}
```

## 🌍 RTL & Internationalization

### RTL Support
```html
<!-- เปิดใช้งาน RTL -->
<html dir="rtl" data-text-dir="rtl">

<!-- RTL-specific utility classes -->
<div class="scaleX-n1-rtl">Only flip in RTL mode</div>
```

### Multi-language
```javascript
// ใน config.js
window.templateCustomizer = new TemplateCustomizer({
  lang: 'th',  // ภาษาเริ่มต้น
  // รองรับ: en, th, zh, ar, de, fr, pt, etc.
});
```

## 🧩 UI Components & Design System

### การใช้งาน Typography
```html
<!-- Headings -->
<h1 class="h1">h1. Bootstrap heading</h1>
<h2 class="h2">h2. Bootstrap heading</h2>
<div class="h3">h3. Bootstrap heading (class)</div>

<!-- Display Headings -->
<h1 class="display-1">Display 1</h1>
<h2 class="display-2">Display 2</h2>

<!-- Lead Text -->
<p class="lead">Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>

<!-- Inline Elements -->
<p>You can use the <mark>mark tag</mark> to highlight text.</p>
<p><del>This line of text is meant to be treated as deleted text.</del></p>
<p><strong>This line rendered as bold text.</strong></p>
<p><em>This line rendered as italicized text.</em></p>
```

### การใช้งาน Cards (Component หลัก)
```html
<!-- Basic Card -->
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text to build on the card title.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div>

<!-- Card with Image -->
<div class="card">
  <img class="card-img-top" src="image.jpg" alt="Card image cap" />
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text.</p>
  </div>
</div>

<!-- Card with Header/Footer -->
<div class="card">
  <div class="card-header">Featured</div>
  <div class="card-body">
    <h5 class="card-title">Special title treatment</h5>
    <p class="card-text">With supporting text below.</p>
  </div>
  <div class="card-footer text-body-secondary">2 days ago</div>
</div>

<!-- Card with List Group -->
<div class="card">
  <ul class="list-group list-group-flush">
    <li class="list-group-item">Cras justo odio</li>
    <li class="list-group-item">Dapibus ac facilisis in</li>
    <li class="list-group-item">Vestibulum at eros</li>
  </ul>
</div>
```

### Buttons & Form Elements
```html
<!-- Button Variants -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-warning">Warning</button>
<button class="btn btn-info">Info</button>
<button class="btn btn-light">Light</button>
<button class="btn btn-dark">Dark</button>

<!-- Button Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Normal</button>
<button class="btn btn-primary btn-lg">Large</button>

<!-- Outline Buttons -->
<button class="btn btn-outline-primary">Outline Primary</button>
<button class="btn btn-outline-secondary">Outline Secondary</button>

<!-- Button with Icons -->
<button class="btn btn-primary">
  <i class="bx bx-plus me-2"></i>Add Item
</button>
```

### Badges & Labels
```html
<!-- Basic Badges -->
<span class="badge bg-primary">Primary</span>
<span class="badge bg-secondary">Secondary</span>
<span class="badge bg-success">Success</span>
<span class="badge bg-danger">Danger</span>

<!-- Label Badges (สีอ่อนกว่า) -->
<span class="badge bg-label-primary">Primary</span>
<span class="badge bg-label-success">Success</span>

<!-- Rounded Pills -->
<span class="badge rounded-pill bg-primary">Pills</span>

<!-- Badge with Numbers -->
<button class="btn btn-primary position-relative">
  Inbox
  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
    99+
  </span>
</button>
```

### Alerts & Notifications
```html
<!-- Basic Alerts -->
<div class="alert alert-primary" role="alert">
  A simple primary alert—check it out!
</div>
<div class="alert alert-success" role="alert">
  A simple success alert—check it out!
</div>
<div class="alert alert-danger" role="alert">
  A simple danger alert—check it out!
</div>

<!-- Dismissible Alerts -->
<div class="alert alert-warning alert-dismissible" role="alert">
  <strong>Holy guacamole!</strong> You should check in on some of those fields below.
  <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
</div>

<!-- Alert with Icons -->
<div class="alert alert-primary d-flex" role="alert">
  <i class="bx bx-info-circle me-2"></i>
  <div>An example alert with an icon</div>
</div>
```

### Icons System
```html
<!-- Boxicons (default) -->
<i class="bx bx-home"></i>
<i class="bx bx-user"></i>
<i class="bx bx-settings"></i>

<!-- Icon Sizes -->
<i class="bx bx-home icon-xs"></i>
<i class="bx bx-home icon-sm"></i>
<i class="bx bx-home icon-md"></i>
<i class="bx bx-home icon-lg"></i>

<!-- Font Awesome -->
<i class="fa fa-home"></i>
<i class="fa fa-user"></i>

<!-- Icon with base class -->
<i class="icon-base bx bx-home"></i>
```

### Modal & Dropdown
```html
<!-- Basic Modal -->
<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#basicModal">
  Launch Modal
</button>

<div class="modal fade" id="basicModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        Modal body text goes here.
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>

<!-- Dropdown -->
<div class="dropdown">
  <button class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown">
    Dropdown button
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="#">Action</a></li>
    <li><a class="dropdown-item" href="#">Another action</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="#">Separated link</a></li>
  </ul>
</div>
```

### Form Controls
```html
<!-- Basic Form -->
<form>
  <div class="mb-6">
    <label for="exampleFormControlInput1" class="form-label">Email address</label>
    <input type="email" class="form-control" id="exampleFormControlInput1" placeholder="name@example.com">
  </div>
  <div class="mb-6">
    <label for="exampleFormControlTextarea1" class="form-label">Example textarea</label>
    <textarea class="form-control" id="exampleFormControlTextarea1" rows="3"></textarea>
  </div>
  <div class="mb-6">
    <label for="exampleFormControlSelect1" class="form-label">Example select</label>
    <select class="form-select" id="exampleFormControlSelect1">
      <option>1</option>
      <option>2</option>
      <option>3</option>
    </select>
  </div>
</form>

<!-- Input Groups -->
<div class="input-group mb-3">
  <span class="input-group-text">@</span>
  <input type="text" class="form-control" placeholder="Username">
</div>

<div class="input-group mb-3">
  <input type="text" class="form-control" placeholder="Search">
  <button class="btn btn-outline-secondary" type="button">
    <i class="bx bx-search"></i>
  </button>
</div>
```

### Navigation & Tabs
```html
<!-- Nav Tabs -->
<ul class="nav nav-tabs" id="myTab" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" id="home-tab" data-bs-toggle="tab" data-bs-target="#home">Home</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" id="profile-tab" data-bs-toggle="tab" data-bs-target="#profile">Profile</button>
  </li>
</ul>
<div class="tab-content" id="myTabContent">
  <div class="tab-pane fade show active" id="home">Home content</div>
  <div class="tab-pane fade" id="profile">Profile content</div>
</div>

<!-- Nav Pills -->
<ul class="nav nav-pills">
  <li class="nav-item">
    <a class="nav-link active" href="#">Active</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="#">Link</a>
  </li>
</ul>
```

### Tables
```html
<!-- Basic Table -->
<div class="table-responsive">
  <table class="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th>Email</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>Developer</td>
        <td>john@example.com</td>
        <td>
          <button class="btn btn-sm btn-outline-primary">Edit</button>
          <button class="btn btn-sm btn-outline-danger">Delete</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Striped Table -->
<table class="table table-striped">
  <!-- content -->
</table>

<!-- Bordered Table -->
<table class="table table-bordered">
  <!-- content -->
</table>
```

### List Groups
```html
<!-- Basic List Group -->
<ul class="list-group">
  <li class="list-group-item">An item</li>
  <li class="list-group-item">A second item</li>
  <li class="list-group-item">A third item</li>
</ul>

<!-- List Group with Badges -->
<ul class="list-group">
  <li class="list-group-item d-flex justify-content-between align-items-center">
    A list item
    <span class="badge bg-primary rounded-pill">14</span>
  </li>
</ul>

<!-- Actionable List Group -->
<div class="list-group">
  <a href="#" class="list-group-item list-group-item-action active">
    The current link item
  </a>
  <a href="#" class="list-group-item list-group-item-action">A link item</a>
</div>
```

## 📈 Charts & Data Visualization

### ApexCharts Integration
```javascript
// ใน dashboards-analytics.js
window.renderDashboardAnalytics = function() {
  if (!window.ApexCharts) return;
  
  const chartConfig = {
    chart: { type: 'line', height: 300 },
    series: [{ name: 'Sales', data: [30, 40, 35, 50, 49] }],
    colors: [window.config.colors.primary],
    theme: { mode: document.documentElement.getAttribute('data-bs-theme') }
  };
  
  const chart = new ApexCharts(
    document.querySelector('#myChart'), 
    chartConfig
  );
  chart.render();
};
```

## 🔍 Troubleshooting

### ปัญหาที่พบบ่อย

1. **กราฟไม่แสดง**
   - ตรวจสอบ ApexCharts ถูกโหลด
   - ตรวจสอบ element ID ตรงกัน
   - เรียก init function หลัง DOM ready

2. **Dropdown ไม่ทำงาน**
   - ตรวจสอบ Bootstrap JS ถูกโหลด
   - ใช้ `data-bs-toggle` attributes
   - ตรวจสอบ Popper.js dependency

3. **สไตล์เพี้ยน**
   - ตรวจสอบโครงสร้าง layout wrapper
   - ใช้ class ตามตัวอย่างเดิม
   - ตรวจสอบ CSS conflicts

4. **Menu ไม่ทำงาน**
   - ตรวจสอบ menu.js ถูกโหลด
   - ตรวจสอบ perfect-scrollbar dependency
   - ตรวจสอบ HTML structure ถูกต้อง

## 🛠️ Installation & Build Process

### Node.js & Package Manager Setup
```bash
# ติดตั้ง dependencies (แนะนำ Yarn)
yarn install
# หรือ
npm install

# รัน development server
yarn serve
# หรือ
npm run serve

# Build สำหรับ production
yarn build:prod
# หรือ
npm run build:prod
```

### Build Configuration
ไฟล์ `build-config.js` ควบคุมการ build:

```javascript
module.exports = {
  base: {
    serverPath: './',
    buildTemplatePath: 'html/vertical-menu-template',
    buildPath: './build'
  },
  development: {
    distPath: './assets/vendor',
    minify: false,
    sourcemaps: false,
    cleanDist: true
  },
  production: {
    distPath: './assets/vendor',
    minify: true,
    sourcemaps: false,
    cleanDist: true
  }
};
```

### Available Build Tasks
| Task | คำอธิบาย |
|------|----------|
| `yarn serve` | รัน local server + watch files |
| `yarn watch` | Watch files สำหรับการเปลี่ยนแปลง |
| `yarn build` | Compile sources และ copy assets |
| `yarn build:css` | Compile SCSS เป็น CSS |
| `yarn build:js` | Transpile & compile JS ด้วย Webpack |
| `yarn build:theme` | รวม CSS/JS เป็นไฟล์เดียว |
| `yarn build:prod` | Build สำหรับ production |

### VS Code Setup (แนะนำ)
1. เปิดโปรเจคที่มี `.vscode/` folder
2. ติดตั้ง Workspace Recommended Extensions
3. ใช้ Prettier & ESLint สำหรับ code formatting

## 📦 Third-party Libraries & Dependencies

### Core Dependencies (จำเป็น)
```json
{
  "bootstrap": "5.x",
  "@popperjs/core": "^2.x", 
  "hammerjs": "^2.x",
  "jquery": "^3.x",
  "perfect-scrollbar": "^1.x"
}
```

### Charts & Visualization
```json
{
  "apexcharts": "ชาร์ตและกราฟ",
  "chart.js": "Charts อีกทางเลือก",
  "leaflet": "Maps แบบ interactive"
}
```

### Form Components
```json
{
  "@form-validation/bundle": "Form validation",
  "flatpickr": "Date picker",
  "select2": "Enhanced select dropdown",
  "bootstrap-select": "Bootstrap select",
  "@yaireo/tagify": "Tag input",
  "nouislider": "Range slider",
  "cleave-zen": "Input masking",
  "quill": "Rich text editor",
  "dropzone": "File upload"
}
```

### UI Enhancement
```json
{
  "sweetalert2": "Modal alerts",
  "notyf": "Toast notifications",
  "animate.css": "CSS animations",
  "aos": "Animate on scroll",
  "swiper": "Touch slider",
  "masonry-layout": "Grid layout",
  "sortablejs": "Drag & drop",
  "shepherd.js": "User tours",
  "clipboard": "Copy to clipboard"
}
```

### Data Components
```json
{
  "datatables.net": "Enhanced tables",
  "datatables.net-bs5": "Bootstrap 5 styling",
  "moment": "Date manipulation",
  "@fullcalendar/core": "Calendar component",
  "jkanban": "Kanban boards",
  "jstree": "Tree view"
}
```

### Icons & Fonts
```json
{
  "@fortawesome/fontawesome-free": "Font Awesome icons",
  "@iconify/json": "Iconify icons",
  "flag-icons": "Country flags"
}
```

## 🔧 Performance & Optimization

### Asset Optimization
- **CSS**: SCSS compilation และ autoprefixing
- **JS**: Webpack transpilation และ bundling  
- **Images**: Optimized images ใน `assets/img/`
- **Fonts**: Web fonts loading optimization

### Production Build
```bash
# สร้าง production build
yarn build:prod

# รวม CSS/JS เป็นไฟล์เดียว (ลด HTTP requests)
yarn build:theme
```

### File Combination
ใช้ comments ใน HTML เพื่อรวมไฟล์:
```html
<!-- build:css assets/vendor/css/theme.css -->
<link rel="stylesheet" href="assets/vendor/css/core.css">
<link rel="stylesheet" href="assets/css/demo.css">
<!-- endbuild -->
```

## 🛠️ Customization & SASS

### Custom Font Integration
```html
<!-- ใน <head> -->
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

```scss
// ใน scss/_custom-variables/_bootstrap-extended.scss
$font-family-sans-serif: 'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !default;
```

### Custom Color Scheme
```javascript
// ใน config.js
window.config = {
  colors: {
    primary: '#7367F0',    // สีหลักของธีม
    secondary: '#82868b',
    success: '#28c76f',
    // ... สีอื่นๆ
  }
};
```

### Custom Skin Creation
1. สร้าง CSS variables สำหรับ `data-skin="your-skin"`
2. เพิ่มใน template-customizer.js:
```javascript
TemplateCustomizer.SKINS.push({
  name: 'your-skin',
  title: 'Your Skin',
  image: 'skin-your-skin.svg'
});
```

### Responsive Breakpoints
```scss
// Breakpoints ที่ใช้ใน theme
$grid-breakpoints: (
  xs: 0,
  sm: 576px,
  md: 768px,
  lg: 992px,
  xl: 1200px,
  xxl: 1400px
);
```

## 🔧 Advanced Configuration

### Menu Collapse Breakpoint
```scss
// ใน scss/_custom-variables/_components.scss
$menu-collapsed-layout-breakpoint: lg !default; // เปลี่ยนจาก xl เป็น lg
```

```javascript
// ใน js/helpers.js
LAYOUT_BREAKPOINT = 992; // อัพเดตให้ตรงกับ CSS breakpoint
```

### Search Configuration  
อัพเดตไฟล์ `assets/json/search-vertical.json`:
```json
{
  "navigation": {
    "parent menu": [
      {
        "name": "New Page",
        "icon": "bx-home",
        "url": "new-page.html"
      }
    ]
  }
}
```

### Multi-language Support
```javascript
// เพิ่มภาษาใหม่ใน template-customizer.js
TemplateCustomizer.LANGUAGES.th = {
  panel_header: 'ตัวปรับแต่งธีม',
  panel_sub_header: 'ปรับแต่งและดูตัวอย่างแบบเรียลไทม์',
  // ... ข้อความอื่นๆ
};
```

## 🚨 Common Issues & Solutions

### Chart Rendering Issues
```javascript
// ตรวจสอบการโหลด ApexCharts
const initCharts = () => {
  if (window.ApexCharts && window.renderDashboardAnalytics) {
    window.renderDashboardAnalytics();
  } else {
    setTimeout(initCharts, 100); // ลองใหม่ทุก 100ms
  }
};
```

### CORS Errors in Development
- ใช้ local server เสมอ (XAMPP, VS Code Live Server, หรือ `yarn serve`)
- ห้ามเปิดไฟล์ HTML โดยตรงจาก file system

### NPM Installation Errors
```bash
# ใช้ legacy peer deps
npm install --legacy-peer-deps

# หรือใช้ Yarn แทน
yarn install
```

### Menu Not Working
- ตรวจสอบ `menu.js` ถูกโหลด
- ตรวจสอบ perfect-scrollbar dependency
- ตรวจสอบ HTML structure

### Dark/Light Theme Issues
```html
<!-- ตรวจสอบ attributes ใน <html> tag -->
<html data-bs-theme="light" dir="ltr">
```

## 🚀 Production Deployment

### Pre-deployment Checklist
- [ ] รัน `yarn build:prod` 
- [ ] ตรวจสอบ assets paths
- [ ] อัพเดต Mapbox tokens (ถ้าใช้)
- [ ] ทดสอบใน production environment
- [ ] ตรวจสอบ responsive design
- [ ] Validate HTML/CSS
- [ ] Test performance

### CDN Integration
```html
<!-- สำหรับ production ใช้ CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.x/dist/css/bootstrap.min.css">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.x/dist/js/bootstrap.bundle.min.js"></script>
```

### Asset Path Configuration
```javascript
// อัพเดต asset paths สำหรับ production
window.assetsPath = './assets/'; // หรือ CDN URL
```

## 📚 Framework Integration

### React Integration (bull-pay)
```jsx
// Component pattern สำหรับ Sneat
const SneatCard = ({ title, children, className = "" }) => (
  <div className={`card ${className}`}>
    <div className="card-body">
      <h5 className="card-title">{title}</h5>
      {children}
    </div>
  </div>
);
```

### Laravel Integration
- ใช้ Sneat Laravel version
- Blade templates integration
- Asset compilation ด้วย Laravel Mix/Vite

### ASP.NET Core Integration  
- Razor Pages/MVC integration
- Bundle & minification
- Authentication integration

### Backend Framework Guidelines
- เก็บ static assets แยกจาก dynamic content
- ใช้ CDN สำหรับ vendor libraries
- Implement proper caching strategies
- Security headers configuration

---

> **หมายเหตุ**: เอกสารนี้สรุปจากเอกสารอย่างเป็นทางการของ Sneat Bootstrap Theme และประสบการณ์การใช้งานใน bull-pay project
> 
> **อ้างอิง**: https://demos.themeselection.com/sneat-bootstrap-html-admin-template/documentation/
