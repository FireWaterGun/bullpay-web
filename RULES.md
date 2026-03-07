# RULES: Sneat Bootstrap Theme + React (bull-pay)

คำแนะนำสั้นๆ สำหรับการใช้ธีม Sneat HTML Admin Template ภายในแอป React (Vite) ของโฟลเดอร์ `bull-pay` เพื่อให้คงหน้าตา/พฤติกรรมตามธีมและดูแลง่าย

## 1) ภาพรวมธีม

- ใช้ Sneat (Bootstrap 5) แบบ HTML Template แล้วเชื่อมกับ React SPA
- สินทรัพย์ของธีม (CSS/JS/รูป) ถูกวางไว้ใน `public/assets/**` และถูกอ้างถึงแบบเส้นทางฐาน `/assets/...`
- สคริปต์ของธีมและไลบรารีที่จำเป็นถูกโหลดครั้งเดียวใน `bull-pay/index.html` (อย่านำเข้าใน component)

## 2) โครงสร้างที่เกี่ยวข้อง

- `public/assets/` — ไฟล์ของธีม Sneat (css/js/vendor/img)
- `src/views/app/` — Layout และหน้าหลักของแดชบอร์ด (`DashboardLayout.jsx`, `DashboardHome.jsx`)
- `src/views/invoices/` — ตัวอย่างหน้าโมดูลย่อย (Invoice)
- `src/routes/AppRouter.jsx` — กำหนดเส้นทางหลักของแอป (เส้นทางภายในเริ่มที่ `/app/...`)

## 3) การรันโครงการ

- ติดตั้ง: `npm install`
- โหมดพัฒนา: `npm run dev`
- โหมดทดสอบ build: `npm run preview` (หลัง `npm run build`)

## 4) สินทรัพย์ธีมที่ถูกโหลด (สำคัญ)

ไฟล์หลักถูกประกาศใน `index.html` แล้ว เช่น:

- CSS: `/assets/vendor/css/core.css`, `/assets/css/demo.css`, Perfect Scrollbar, Pickr, Page Auth CSS, Iconify/Boxicons
- JS: `/assets/vendor/js/helpers.js`, `template-customizer.js`, `/assets/js/config.js`, jQuery, Popper, Bootstrap, Perfect Scrollbar, Hammer, `menu.js`, ApexCharts, FormValidation, `/assets/js/main.js`, `/assets/js/dashboards-analytics.js`
  แนวทาง: โหลดจาก `index.html` เท่านั้น ให้ component React ใช้งานผ่าน global (เช่น `window.ApexCharts`).

## 5) แนวทางใช้ UI Components ใน React

- ใช้ class ของ Sneat/Bootstrap ตามตัวอย่าง HTML ต้นฉบับ เช่น `card`, `btn`, `dropdown`, `menu`, `layout-*` ฯลฯ
- โครงหน้า dashboard ควรอยู่ในโครง `layout-wrapper > layout-container > content-wrapper` ตามที่ `DashboardLayout.jsx` จัดการให้แล้ว
- ไอคอน: ใช้ Boxicons (`bx ...`) หรือไฟล์ Iconify ที่มีให้ หากใช้ `bx` ต้องมีลิงก์ Boxicons (มีใน `index.html` แล้ว)
- Dropdown/Offcanvas/Collapse ใช้ data-attribute ของ Bootstrap (`data-bs-toggle` ฯลฯ) ได้เลย เพราะ Bootstrap JS ถูกโหลดแล้ว

ตัวอย่าง Card (JSX):

```jsx
<div className="card">
  <div className="card-body">
    <h5 className="card-title mb-3">Title</h5>
    <p className="mb-0">Content</p>
  </div>
</div>
```

## 6) Routing และการเพิ่มหน้าใหม่

- สร้างไฟล์หน้าที่ `src/views/.../MyPage.jsx`
- เพิ่ม Route ใน `DashboardLayout.jsx` ภายใน `<Routes>` ของส่วน content
- เพิ่มเมนูในแถบข้างด้วย `MenuItem` หรือใส่เป็นกลุ่มด้วย `MenuGroup`/`SubItem`

ตัวอย่างเพิ่ม Route อย่างย่อ:

```jsx
// ...existing code...
<Routes>
  <Route index element={<DashboardHome />} />
  <Route path="reports" element={<ReportsPage />} />
  <Route path="*" element={<Navigate to="." replace />} />
</Routes>
// ...existing code...
```

## 7) Charts (ApexCharts) และสคริปต์หน้า Dashboard

- ธีมโหลด ApexCharts และไฟล์ `/assets/js/dashboards-analytics.js` ซึ่งมีฟังก์ชัน `window.renderDashboardAnalytics()` สำหรับวาดกราฟ
- ใน `DashboardHome.jsx` มี `useEffect` เรียกฟังก์ชันดังกล่าวหลัง DOM พร้อมแล้ว
- หากเพิ่มกราฟใหม่ ให้:
  1. ใส่ container ที่มี `id` เฉพาะใน JSX (เช่น `<div id="myChart"></div>`)
  2. เพิ่มโค้ดสร้างกราฟลงในไฟล์ธีม (เช่น แก้ใน `/assets/js/dashboards-analytics.js`) ภายในฟังก์ชัน init ที่เปิดเป็น global

## 8) ธีม สี และภาษา

- โหมดแสง/มืด: ควบคุมผ่าน `data-bs-theme` บน `<html>` ซึ่ง `DashboardLayout.jsx` จัดการและจำค่าไว้ใน `localStorage` คีย์ `ui_theme` (`light` | `dark` | `system`)
- ภาษา: ใช้ i18next (`react-i18next`) เปลี่ยนภาษาโดยตั้งค่าใน layout และ sync กับ `<html lang>`

## 9) พฤติกรรม Sidebar/เมนู

- Desktop (≥ xl): ปุ่ม toggle จะสลับ class `layout-menu-collapsed` บน `<html>`
- Mobile (< xl): ใช้ class `layout-menu-expanded` สำหรับเปิด/ปิดเมนูด้านข้างอัตโนมัติเมื่อกดเมนูย่อย
- การเปิด/ปิดและอนิเมชันเมนูถูกจัดการใน `DashboardLayout.jsx` แล้ว (รวม hover เมื่อถูกย่อ)

## 10) ข้อควรทำ/ไม่ควรทำ

- ห้าม import jQuery/Bootstrap JS เข้าไปใน component ให้ใช้ตัวที่โหลดจาก `index.html` ผ่าน `window`
- ใช้ class ของ Sneat ตรงตามตัวอย่าง จะได้ UI/spacing ถูกต้อง
- เมื่อเพิ่มสคริปต์ของหน้าใหม่ ให้รวมเข้าไฟล์ธีมหรือสร้างฟังก์ชัน global แล้วเรียกใน `useEffect` ของหน้า
- รูป/ไอคอน ให้ชี้ไปที่ `/assets/...` หรือวางไฟล์ไว้ใต้ `public/assets/`

## 11) แก้ปัญหาทั่วไป

- กราฟไม่ขึ้น: ตรวจไฟล์ ApexCharts + `dashboards-analytics.js` ถูกโหลด, มี `window.renderDashboardAnalytics`, และ `id` ตรงกับที่สคริปต์ใช้งาน
- Dropdown/Modal ไม่ทำงาน: ตรวจ `data-bs-toggle` และมี Bootstrap JS ใน `index.html`
- สไตล์เพี้ยน: ตรวจว่ากรอบโครงสร้าง (`layout-*`, `content-wrapper`, `container-xxl`) อยู่ครบตามธีม

อ้างอิงเอกสารธีม: https://demos.themeselection.com/sneat-bootstrap-html-admin-template/documentation/index.html

---

## 🏗️ React Architecture & Best Practices

### โครงสร้างโฟลเดอร์ (Folder Structure)

```
📦 bull-pay/src/
├── 📂 api/                     # API calls & services
├── 📂 assets/                  # Static assets (images, icons)
├── 📂 context/                 # React Context providers
│   └── 📄 AuthContext.jsx      # Authentication state
├── 📂 i18n/                    # Internationalization config
├── 📂 locales/                 # Translation files (en.json, th.json)
├── 📂 routes/                  # Routing configuration
│   └── 📄 AppRouter.jsx        # Main router with auth protection
├── 📂 types/                   # TypeScript definitions (if used)
├── 📂 utils/                   # Utility functions
├── 📂 views/                   # Page components
│   ├── 📂 app/                 # Dashboard layout & pages
│   │   ├── 📄 DashboardLayout.jsx    # Main layout wrapper
│   │   ├── 📄 DashboardHome.jsx      # Dashboard home page
│   │   └── 📄 Settings.jsx           # Settings page
│   ├── 📂 auth/                # Authentication pages
│   │   ├── 📄 LoginPage.jsx
│   │   ├── 📄 RegisterPage.jsx
│   │   └── 📄 ForgotPage.jsx
│   └── 📂 invoices/            # Feature modules
│       ├── 📄 InvoiceList.jsx
│       └── 📄 InvoiceCreate.jsx
├── 📄 main.jsx                 # React app entry point
└── 📄 App.jsx                  # (unused - replaced by AppRouter)
```

### Component Organization Patterns

#### 1. Layout Components (Containers)

```jsx
// DashboardLayout.jsx - Main layout wrapper
export default function DashboardLayout() {
  // Layout-specific state (theme, language, menu collapse)
  const [theme, setTheme] = useState('light')
  const [collapsed, setCollapsed] = useState(false)

  // Layout effects (HTML attributes, event listeners)
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    // ... other layout setup
  }, [theme])

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        {/* Sidebar Menu */}
        <aside className="layout-menu">...</aside>

        {/* Main Content Area */}
        <div className="layout-page">
          <nav className="layout-navbar">...</nav>
          <div className="content-wrapper">
            <Routes>{/* Nested routing for dashboard pages */}</Routes>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2. Page Components

```jsx
// DashboardHome.jsx - Page-level component
export default function DashboardHome() {
  // Page-specific effects (charts, data loading)
  useEffect(() => {
    if (window.ApexCharts && window.renderDashboardAnalytics) {
      window.renderDashboardAnalytics()
    }
  }, [])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {/* Page content with Sneat classes */}
      <StatsCards />
      <ChartsSection />
      <TablesSection />
    </div>
  )
}
```

#### 3. Reusable UI Components

```jsx
// MenuItem.jsx - Navigation component
function MenuItem({ to, icon, label, end }) {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: !!end })
  const isActive = !!match

  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <NavLink to={to} className="menu-link">
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </NavLink>
    </li>
  )
}

// MenuGroup.jsx - Collapsible menu group
function MenuGroup({ base, icon, label, children }) {
  const [open, setOpen] = useState(false)
  const subRef = useRef(null)

  // Smooth animation for menu expansion
  useEffect(() => {
    const sub = subRef.current
    if (!sub) return

    sub.style.transition = 'max-height 0.3s ease-in-out'
    sub.style.maxHeight = open ? `${sub.scrollHeight}px` : '0px'
  }, [open])

  return (
    <li className={`menu-item ${open ? 'open' : ''}`}>
      <a
        href="#"
        className="menu-link menu-toggle"
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </a>
      <ul className="menu-sub" ref={subRef}>
        {children}
      </ul>
    </li>
  )
}
```

### State Management Patterns

#### 1. Context Pattern for Global State

```jsx
// AuthContext.jsx - Authentication state
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Persist auth state
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Validate token and set user
      validateAndSetUser(token)
    }
    setIsReady(true)
  }, [])

  const login = useCallback(async (credentials) => {
    const { user, token } = await api.login(credentials)
    localStorage.setItem('auth_token', token)
    setUser(user)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isReady,
      login,
      logout,
    }),
    [user, isAuthenticated, isReady, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### 2. Local State for Component-Specific Data

```jsx
// Settings.jsx - Component-specific state
export default function Settings() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    notifications: true,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.updateSettings(formData)
      // Success feedback
    } catch (error) {
      setErrors(error.fields || {})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <form onSubmit={handleSubmit}>{/* Form fields with Sneat styling */}</form>
    </div>
  )
}
```

### Routing Patterns

#### 1. Protected Routes

```jsx
// AppRouter.jsx - Main routing configuration
function ProtectedRoute({ children }) {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return <div>Loading...</div> // or spinner component
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected dashboard routes */}
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

#### 2. Nested Routing in Layout

```jsx
// DashboardLayout.jsx - Nested routes within layout
export default function DashboardLayout() {
  return (
    <div className="layout-wrapper">
      {/* Sidebar and navbar */}
      <div className="content-wrapper">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="settings" element={<Settings />} />
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/create" element={<InvoiceCreate />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </div>
    </div>
  )
}
```

### Performance Optimization Patterns

#### 1. Code Splitting (Lazy Loading)

```jsx
// Lazy load heavy components
const InvoiceList = lazy(() => import('../invoices/InvoiceList'))
const InvoiceCreate = lazy(() => import('../invoices/InvoiceCreate'))

function DashboardLayout() {
  return (
    <div className="content-wrapper">
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/create" element={<InvoiceCreate />} />
        </Routes>
      </Suspense>
    </div>
  )
}
```

#### 2. Memoization for Expensive Operations

```jsx
// DashboardHome.jsx - Memoize chart data
export default function DashboardHome() {
  const chartData = useMemo(() => {
    return processChartData(rawData)
  }, [rawData])

  const statsCards = useMemo(() => {
    return calculateStats(data)
  }, [data])

  return (
    <div className="container-xxl">
      <StatsCards data={statsCards} />
      <Charts data={chartData} />
    </div>
  )
}
```

### Error Handling Patterns

#### 1. Error Boundaries

```jsx
// ErrorBoundary.jsx - Catch component errors
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>Try again</button>
        </div>
      )
    }

    return this.props.children
  }
}
```

#### 2. API Error Handling

```jsx
// utils/api.js - Centralized API error handling
export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new ApiError(response.status, await response.json())
    }

    return await response.json()
  } catch (error) {
    if (error.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    throw error
  }
}
```

### Testing Patterns

#### 1. Component Testing Structure

```jsx
// __tests__/DashboardHome.test.jsx
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import DashboardHome from '../views/app/DashboardHome'

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  )
}

describe('DashboardHome', () => {
  test('renders main dashboard elements', () => {
    renderWithProviders(<DashboardHome />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
    expect(screen.getByTestId('charts-section')).toBeInTheDocument()
  })
})
```

### Code Style & Standards

#### 1. Component Naming Convention

- **PascalCase** for components: `DashboardHome`, `InvoiceList`
- **camelCase** for functions and variables: `handleSubmit`, `userData`
- **kebab-case** for file names when multiple words: `dashboard-home.jsx`

#### 2. Props Pattern

```jsx
// Good: Destructured props with defaults
function Card({ title, children, className = '', variant = 'default' }) {
  return (
    <div className={`card ${className} card-${variant}`}>
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        {children}
      </div>
    </div>
  )
}

// Usage
;<Card title="Statistics" variant="primary" className="mb-6">
  <p>Card content</p>
</Card>
```

#### 3. Custom Hooks Pattern

```jsx
// hooks/useTheme.js - Custom hook for theme management
export function useTheme() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('ui_theme')
    if (saved) setTheme(saved)
  }, [])

  const updateTheme = useCallback((newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('ui_theme', newTheme)
    document.documentElement.setAttribute('data-bs-theme', newTheme)
  }, [])

  return { theme, updateTheme }
}
```

### Integration with Sneat Theme

#### 1. Maintaining Theme Classes

```jsx
// Always use Sneat's class structure
function StatsCard({ icon, title, value, change }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="card-title d-flex align-items-start justify-content-between mb-4">
          <div className="avatar flex-shrink-0">
            <span className="avatar-initial rounded bg-label-primary">
              <i className={`bx ${icon} icon-lg`}></i>
            </span>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-end">
          <div>
            <h4 className="card-title mb-1">{value}</h4>
            <small className="text-success fw-medium">
              <i className="bx bx-up-arrow-alt"></i> {change}
            </small>
          </div>
        </div>
      </div>
    </div>
  )
}
```

#### 2. Global Script Integration

```jsx
// DashboardHome.jsx - Using global Sneat scripts
export default function DashboardHome() {
  useEffect(() => {
    // Wait for Sneat scripts to load
    const initCharts = () => {
      if (window.ApexCharts && window.renderDashboardAnalytics) {
        window.renderDashboardAnalytics()
      } else {
        setTimeout(initCharts, 100)
      }
    }

    initCharts()
  }, [])

  return (
    <div className="container-xxl">
      {/* Chart containers with exact IDs from Sneat */}
      <div id="totalRevenueChart"></div>
      <div id="orderChart"></div>
    </div>
  )
}
```
