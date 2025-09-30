import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Catalog from './pages/Catalog.jsx'
import Categories from './pages/Categories.jsx'
import CategoryItems from './pages/CategoryItems.jsx'
import Checkout from './pages/Checkout.jsx'
import Cart from './pages/Cart.jsx'
import ItemDetails from './pages/ItemDetails.jsx'
import { AboutPage, OrderPage } from './pages/PlaceholderPages.jsx'
const Placeholder = ({label}) => <div className="container"><div className="header"><div className="logo">{label}</div></div></div>

const router = createBrowserRouter([
  { path: '/:slug', element: <Catalog /> },
  { path: '/:slug/catalog', element: <Categories /> },
  { path: '/:slug/catalog/:categoryId', element: <CategoryItems /> },
  { path: '/:slug/cart', element: <Cart /> },
  { path: '/:slug/item/:itemId', element: <ItemDetails /> },
  { path: '/:slug/profile', element: <Placeholder label="Профиль" /> },
  { path: '/:slug/checkout', element: <Checkout /> },
  { path: '/:slug/about', element: <AboutPage /> },
  { path: '/:slug/order', element: <OrderPage /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
