import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from './Button'

interface AdminLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
}

interface NavItem {
  label: string
  path: string
}

const navItems: NavItem[] = [
  { label: '설문관리', path: '/admin/dashboard' },
  { label: '응답확인', path: '/admin/responses' },
]

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  onLogout,
}) => {
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-primary-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/admin/dashboard" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">Survey Admin</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
            >
              로그아웃
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-primary-white border-b border-gray-200 px-4 py-2">
        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors duration-200 ${
                isActive(item.path)
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout
