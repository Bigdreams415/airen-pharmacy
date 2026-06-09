import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, Sale } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useSales } from '../hooks/useLedger';
import { useBarcode } from '../hooks/useBarcode';

const PointOfSale: React.FC = () => {
  const { products, loading: productsLoading, error: productsError } = useProducts();
  const { createSale, loading: salesLoading, error: salesError } = useSales();
  const { handleBarcodeScan, scannedProduct, clearScannedProduct, loading: barcodeLoading, error: barcodeError } = useBarcode();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [saleSuccess, setSaleSuccess] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastSaleItemCount, setLastSaleItemCount] = useState(0);
  const [lastSaleUnitCount, setLastSaleUnitCount] = useState(0);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Mobile state
  const [activeTab, setActiveTab] = useState<'products' | 'cart'>('products');

  // Get unique categories for filter
  const categories = ['all', ...Array.from(new Set(products.map(product => product.category)))];

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Auto-add scanned product to cart
  useEffect(() => {
    if (scannedProduct && !productsLoading) {
      addToCart(scannedProduct);
      setSearchTerm('');
      setTimeout(() => clearScannedProduct(), 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedProduct, productsLoading]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (saleSuccess) {
      const timer = setTimeout(() => setSaleSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saleSuccess]);

  // Function to add product to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock!');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > product.stock) {
          alert(`Only ${product.stock} items available in stock!`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { 
        product, 
        quantity: 1,
        unit_price: product.sell_price || 0
      }];
    });
    
    if (window.innerWidth < 1024) {
      setActiveTab('cart');
    }
  };

  // Function to remove item from cart
  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Function to update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return removeFromCart(productId);

    const product = products.find(p => p.id === productId);
    if (product && newQuantity > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + ((item.unit_price || 0) * item.quantity), 0);

  // Function to process sale
  const handleProcessSale = async () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  // Function to confirm and process sale
  const confirmSale = async () => {
    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_sell_price: item.unit_price || 0
        })),
        payment_method: paymentMethod
      };

      const result = await createSale(saleData);

      setLastSaleItemCount(cart.length);
      setLastSaleUnitCount(cart.reduce((sum, item) => sum + item.quantity, 0));
      setLastSale(result);
      setSaleSuccess(`Sale processed successfully! Total: ₦${(result.total_amount || 0).toFixed(2)}`);
      setCart([]);
      setShowPaymentModal(false);
      setPaymentMethod('cash');
      setShowReceiptModal(true);
      
    } catch (error) {
      console.error('Sale processing error:', error);
    }
  };

  // Function to print receipt
  const printReceipt = () => {
    if (!receiptRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print receipt');
      return;
    }

    const receiptContent = receiptRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${lastSale?.id}</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              margin: 0; 
              padding: 10px;
              background: white;
              color: black;
            }
            .receipt { 
              width: 280px; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 15px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .business-name { 
              font-size: 16px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .business-info { 
              font-size: 10px; 
              margin-bottom: 5px;
            }
            .transaction-info { 
              margin: 10px 0;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .items { 
              margin: 15px 0;
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 3px 0;
            }
            .item-name { 
              flex: 2; 
            }
            .item-details { 
              flex: 1; 
              text-align: right;
            }
            .totals { 
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 15px 0;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px;
              font-size: 10px;
            }
            .thank-you {
              text-align: center;
              margin: 15px 0;
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            ${receiptContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Function to close receipt and continue
  const closeReceiptAndContinue = () => {
    setShowReceiptModal(false);
    setLastSale(null);
    if (window.innerWidth < 1024) {
      setActiveTab('products');
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Handle Enter key for barcode scan in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      handleBarcodeScan(searchTerm.trim());
    }
  };

  if (productsLoading && products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading store products...</div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Point of Sale</h2>
        <p className="text-gray-600 mt-1">Scan, search, or select items to sell</p>
      </div>
      
      {/* Success Message */}
      {saleSuccess && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-300 text-blue-800 rounded-xl">
          <div className="flex items-center">
            <span className="text-blue-600 mr-3">✅</span>
            <div className="font-medium">{saleSuccess}</div>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {productsError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-3">⚠️</span>
            <div>
              <p className="font-medium text-sm">Products Error</p>
              <p className="text-sm mt-1">{productsError}</p>
            </div>
          </div>
        </div>
      )}

      {salesError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-3">⚠️</span>
            <div>
              <p className="font-medium text-sm">Sales Error</p>
              <p className="text-sm mt-1">{salesError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Status */}
      {barcodeLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-sm text-blue-800">Scanning barcode...</p>
          </div>
        </div>
      )}

      {barcodeError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start">
            <span className="text-red-500 mr-3">⚠️</span>
            <div>
              <p className="text-sm font-medium text-red-800">Barcode Error</p>
              <p className="text-xs text-red-600 mt-1">
                Product not found. Please check the barcode and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {scannedProduct && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-blue-600 text-xl">✅</span>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Added to cart: {scannedProduct.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Price: ₦{(scannedProduct.sell_price || 0).toLocaleString()} | Stock: {scannedProduct.stock}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tabs */}
      <div className="lg:hidden mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            className={`flex-1 py-3 text-center font-medium rounded-lg transition-all ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('products')}
          >
            Products ({filteredProducts.length})
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium rounded-lg transition-all ${
              activeTab === 'cart'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('cart')}
          >
            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search products by name, category, or scan barcode to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        {(searchTerm || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Filtered by:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium">
                Category: {selectedCategory}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium ml-auto px-3 py-1.5 hover:bg-red-50 rounded-lg"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Products Grid */}
        <div className="col-span-2 bg-gray-100 rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Available Products ({filteredProducts.length})
            </h3>
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
              {products.reduce((sum, p) => sum + p.stock, 0)} items in stock
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4 text-gray-300">🛒</div>
              <p className="text-lg mb-2">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No products match your filters.' 
                  : 'No products available.'}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try clearing your filters' 
                  : 'Add products to inventory first'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => product.stock > 0 && addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`bg-white rounded-xl shadow-md p-4 text-left border transition-all focus:outline-none ${
                    product.stock > 0 
                      ? 'hover:shadow-xl hover:border-blue-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
                      : 'opacity-60 cursor-not-allowed'
                  } ${product.stock <= 5 ? 'border-yellow-200' : 'border-gray-200'}`}
                >
                  <div className="mb-3">
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-blue-900">₦{(product.sell_price || 0).toLocaleString()}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.stock > 10 ? 'bg-blue-100 text-blue-800' :
                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                  
                  {product.stock <= 0 && (
                    <p className="text-xs text-red-600 text-center">Out of Stock</p>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <p className="text-xs text-yellow-600 text-center">⚠️ Low Stock</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Shopping Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>
          
          <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4 text-gray-300">🛒</div>
                <p className="text-lg mb-2">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add products to start a sale</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      ₦{(item.unit_price || 0).toLocaleString()} each
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300">
                      <button
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 rounded-l-lg transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="text-sm w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 rounded-r-lg transition-colors"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right min-w-0 ml-2">
                      <div className="font-semibold text-gray-800">₦{((item.unit_price || 0) * item.quantity).toLocaleString()}</div>
                    </div>
                    <button
                      className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <span className="text-lg">×</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals and Checkout */}
          {cart.length > 0 && (
            <div className="mt-6 space-y-4 border-t pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (0%):</span>
                  <span>₦0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-700">₦{subtotal.toLocaleString()}</span>
                </div>
              </div>
              
              <button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                onClick={handleProcessSale}
                disabled={cart.length === 0 || salesLoading}
              >
                {salesLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : 'Proceed to Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Products ({filteredProducts.length})
              </h3>
              <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {products.reduce((sum, p) => sum + p.stock, 0)} in stock
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4 text-gray-300">🛒</div>
                <p className="text-lg mb-2">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No products match your filters.' 
                    : 'No products available.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => product.stock > 0 && addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`bg-white rounded-xl shadow-md p-3 text-left border transition-all focus:outline-none ${
                        product.stock > 0 
                          ? 'hover:shadow-lg hover:border-blue-300 cursor-pointer active:scale-[0.98]' 
                          : 'opacity-60 cursor-not-allowed'
                      } ${product.stock <= 5 ? 'border-yellow-200' : 'border-gray-200'}`}
                    >
                    <div className="mb-2">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-blue-900">₦{(product.sell_price || 0).toLocaleString()}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.stock > 10 ? 'bg-blue-100 text-blue-800' :
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart Tab */}
        {activeTab === 'cart' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-4 text-gray-300">🛒</div>
                  <p className="text-lg mb-2">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Tap on products to add them</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        ₦{(item.unit_price || 0).toLocaleString()} each
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300">
                        <button
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-800 text-sm">₦{((item.unit_price || 0) * item.quantity).toLocaleString()}</div>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals and Checkout */}
            {cart.length > 0 && (
              <div className="mt-6 space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal:</span>
                    <span>₦{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-blue-700">₦{subtotal.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
                  onClick={handleProcessSale}
                  disabled={cart.length === 0 || salesLoading}
                >
                  {salesLoading ? 'Processing...' : 'Process Sale'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment Method Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Select Payment Method</h3>
            
            <div className="space-y-4 mb-8">
              {(['cash', 'card', 'transfer'] as const).map((method) => (
                <label 
                  key={method} 
                  className={`flex items-center space-x-4 cursor-pointer p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === method 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize font-medium text-gray-800">{method}</span>
                  <span className="ml-auto text-gray-400">
                    {method === 'cash' ? '💵' : method === 'card' ? '💳' : '🏦'}
                  </span>
                </label>
              ))}
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-700">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                {cart.length} items • {cart.reduce((sum, item) => sum + item.quantity, 0)} units
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 font-medium hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                disabled={salesLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmSale}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50"
                disabled={salesLoading}
              >
                {salesLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : 'Confirm Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Sale Completed Successfully!</h3>
            
            {/* Printable Receipt (hidden in main view) */}
            <div ref={receiptRef} className="hidden">
              <div className="header">
                <div className="business-name">Airen Pharmacy</div>
                <div className="business-info">Your Trusted Pharmacy Store</div>
                <div className="business-info">87A Sapele Rd, Benin City</div>
                <div className="business-info">Contact: +2349081307439</div>
              </div>
              
              <div className="transaction-info">
                <div>Receipt #: {lastSale.id}</div>
                <div>Date: {new Date(lastSale.created_at).toLocaleString()}</div>
                <div>Payment: {lastSale.payment_method.toUpperCase()}</div>
              </div>
              
              <div className="items">
                <div className="item-row" style={{borderBottom: '1px dashed #000', paddingBottom: '5px', marginBottom: '5px'}}>
                  <div className="item-name"><strong>ITEM</strong></div>
                  <div className="item-details"><strong>QTY × PRICE</strong></div>
                  <div className="item-details"><strong>AMOUNT</strong></div>
                </div>
                  {lastSale.items?.map((item, index) => (
                    <div key={index} className="item-row">
                      <div className="item-name">
                        {item.product_name || 'Product'}
                      </div>
                      <div className="item-details">{item.quantity} × ₦{(item.unit_sell_price || 0).toFixed(2)}</div>
                      <div className="item-details">₦{(item.total_sell_price || 0).toFixed(2)}</div>
                    </div>
                  ))}
              </div>
              
              <div className="totals">
                <div className="total-row">
                  <div>Subtotal:</div>
                  <div>₦{(lastSale.total_amount || 0).toFixed(2)}</div>
                </div>
                <div className="total-row">
                  <div>Tax (0%):</div>
                  <div>₦0.00</div>
                </div>
                <div className="total-row">
                  <div><strong>Total:</strong></div>
                  <div><strong>₦{(lastSale.total_amount || 0).toFixed(2)}</strong></div>
                </div>
                <div className="total-row">
                  <div>Payment:</div>
                  <div>{lastSale.payment_method.toUpperCase()}</div>
                </div>
              </div>
              
              <div className="thank-you">
                THANK YOU FOR SHOPPING WITH US!
              </div>
              
              <div className="footer">
                <div>Quality Guaranteed</div>
                <div>Valid receipt for exchange within 7 days</div>
                <div>--- Airen Pharmacy ---</div>
              </div>
            </div>

            {/* Receipt Preview */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-blue-600">✅</span>
              </div>
              <div className="text-blue-700 font-semibold mb-2">
                ✅ Sale Completed Successfully
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Transaction #{lastSale.id}
              </div>
              <div className="text-3xl font-bold mt-2 text-blue-800">
                ₦{(lastSale.total_amount || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {lastSaleItemCount} item{lastSaleItemCount !== 1 ? 's' : ''} • {lastSaleUnitCount} unit{lastSaleUnitCount !== 1 ? 's' : ''}
              </div>
              <div className="text-sm font-medium text-gray-700 mt-3 bg-white px-3 py-1.5 rounded-full inline-block">
                Payment: {lastSale.payment_method.toUpperCase()}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={printReceipt}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-3 shadow-md"
              >
                <span className="text-xl">🖨️</span>
                <span>Print Receipt</span>
              </button>
              
              <button
                onClick={closeReceiptAndContinue}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
              >
                Continue Selling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointOfSale;