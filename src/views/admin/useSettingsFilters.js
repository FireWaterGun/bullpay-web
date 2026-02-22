import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function useSettingsFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const initCategory = searchParams.get('category') || ''
  const initScope = searchParams.get('scope') || ''
  const initSearch = searchParams.get('search') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [currentPage, setCurrentPage] = useState(initPage)
  const [categoryFilter, setCategoryFilter] = useState(initCategory)
  const [scopeFilter, setScopeFilter] = useState(initScope)
  const [searchFilter, setSearchFilter] = useState(initSearch)
  const [appliedFilters, setAppliedFilters] = useState(() => {
    const f = {}
    if (initCategory) f.category = initCategory
    if (initScope) f.scope = initScope
    if (initSearch) f.search = initSearch
    return f
  })

  function syncSearchParams(filters, page) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }

  function applyFilters() {
    const f = { category: categoryFilter || undefined, scope: scopeFilter || undefined, search: searchFilter || undefined }
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function resetFilters() {
    setCategoryFilter('')
    setScopeFilter('')
    setSearchFilter('')
    setAppliedFilters({})
    setCurrentPage(1)
    syncSearchParams({}, 1)
  }

  function handleCategoryClick(cat, currentFilters) {
    const newCat = currentFilters.category === cat ? '' : cat
    setCategoryFilter(newCat)
    const f = { ...currentFilters, category: newCat || undefined }
    if (!newCat) delete f.category
    setAppliedFilters(f)
    setCurrentPage(1)
    syncSearchParams(f, 1)
  }

  function setPageAndSync(page, filters) {
    setCurrentPage(page)
    syncSearchParams(filters, page)
  }

  function initDefaultCategory(category) {
    setCategoryFilter(category)
    const f = { ...appliedFilters, category }
    setAppliedFilters(f)
    syncSearchParams(f, currentPage)
  }

  return {
    searchParams,
    currentPage,
    setCurrentPage,
    categoryFilter,
    setCategoryFilter,
    scopeFilter,
    setScopeFilter,
    searchFilter,
    setSearchFilter,
    appliedFilters,
    setAppliedFilters,
    syncSearchParams,
    applyFilters,
    resetFilters,
    handleCategoryClick,
    setPageAndSync,
    initDefaultCategory,
  }
}
