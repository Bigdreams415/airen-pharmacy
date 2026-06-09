import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { useProducts } from '../hooks/useProducts';
import { useBarcode } from '../hooks/useBarcode';
import { apiService } from '../services/api'; 
import { useAuthCheck } from '../hooks/useAuthCheck';

const Inventory: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    addProduct, 
    updateProduct, 
    deleteProduct 
  } = useProducts();
  const { isAdmin } = useAuthCheck();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      console.log('Attempting to add product:', productData);
      await addProduct(productData);
      console.log('Product added successfully');
      setShowAddForm(false);
      setActionError(null);
    } catch (error) {
      console.error('Error adding product:', error);
      setActionError('Failed to add product. Please try again.');
    }
  };

  const handleEditProduct = async (updatedProduct: Product | Omit<Product, 'id'>) => {
    try {
      console.log('Attempting to update product:', updatedProduct);
      await updateProduct(updatedProduct as Product);
      console.log('Product updated successfully');
      setEditingProduct(null);
      setActionError(null);
    } catch (error) {
      console.error('Error updating product:', error);
      setActionError('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        console.log('Attempting to delete product:', productId);
        await deleteProduct(productId);
        console.log('Product deleted successfully');
        setActionError(null);
      } catch (error) {
        console.error('Error deleting product:', error);
        setActionError('Failed to delete product. Please try again.');
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-lg text-gray-600">Loading store inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Store Inventory</h2>
          <p className="text-gray-600 mt-1">Manage your pharmacy store products</p>
        </div>
        <div className="flex gap-3">
          {/* View Mode Toggle - Mobile Only */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Grid
            </button>
          </div>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <span className="text-lg">+</span>
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-3">⚠️</span>
            <div>
              <p className="font-medium text-sm">Database Error</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <div className="flex items-center">
            <span className="text-red-500 mr-3">⚠️</span>
            <div>
              <p className="font-medium text-sm">Action Error</p>
              <p className="text-sm mt-1">{actionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-400">🔍</span>
        </div>
        <input
          type="text"
          placeholder="Search products by name, category, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Products Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''} found
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          Total Value: ₦{products.reduce((sum, p) => sum + (p.buy_price * p.stock), 0).toLocaleString()}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4 text-gray-300">📦</div>
            <p className="text-lg mb-2">{searchTerm ? 'No products match your search.' : 'Your inventory is empty'}</p>
            <p className="text-sm text-gray-400">{searchTerm ? 'Try a different search term' : 'Add your first product to get started!'}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Profit Margin
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const profitMargin = product.sell_price - product.buy_price;
                const profitPercentage = (profitMargin / product.buy_price) * 100;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.barcode && (
                        <div className="text-xs text-gray-500">Barcode: {product.barcode}</div>
                      )}
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₦{product.buy_price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-700">₦{product.sell_price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="font-medium text-gray-900">₦{profitMargin.toLocaleString()}</div>
                        <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          profitPercentage >= 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {profitPercentage >= 0 ? '+' : ''}{profitPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                        <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${
                          product.stock > 20 ? 'bg-blue-100 text-blue-800' : 
                          product.stock > 5 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} units
                        </span>
                        {product.stock <= 5 && (
                          <span className="text-xs text-red-600 mt-1">⚠️ Low stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(product.updated_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                        disabled={!isAdmin}
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-800 font-medium px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile Views */}
      <div className="lg:hidden">
        {/* Mobile Table View */}
        {viewMode === 'table' && filteredProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const profitMargin = product.sell_price - product.buy_price;
                const profitPercentage = (profitMargin / product.buy_price) * 100;
                
                return (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {product.category}
                          </span>
                          {product.barcode && (
                            <span className="text-xs text-gray-500">📋 {product.barcode}</span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${
                        product.stock > 20 ? 'bg-blue-100 text-blue-800' : 
                        product.stock > 5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Cost Price</div>
                        <div className="font-medium">₦{product.buy_price.toLocaleString()}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Selling Price</div>
                        <div className="font-medium text-blue-700">₦{product.sell_price.toLocaleString()}</div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Profit</div>
                        <div className={`font-medium ${profitMargin >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                          ₦{profitMargin.toLocaleString()}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        profitPercentage >= 0 ? 'bg-blue-50' : 'bg-red-50'
                      }`}>
                        <div className="text-xs text-gray-600 mb-1">Margin</div>
                        <div className={`font-medium ${profitPercentage >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                          {profitPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Updated: {formatDate(product.updated_at)}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
                          disabled={!isAdmin}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Grid View */}
        {viewMode === 'grid' && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const profitMargin = product.sell_price - product.buy_price;
              
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="mb-3">
                    <div className="font-medium text-gray-900 text-sm mb-1 truncate">{product.name}</div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {product.category}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        product.stock > 20 ? 'bg-blue-100 text-blue-800' : 
                        product.stock > 5 ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.stock}
                      </span>
                    </div>
                    {product.barcode && (
                      <div className="text-xs text-gray-400">📋 {product.barcode}</div>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Cost:</span>
                      <span className="font-medium">₦{product.buy_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Price:</span>
                      <span className="font-medium text-blue-700">₦{product.sell_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-xs">Profit:</span>
                      <span className={`font-medium ${profitMargin >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₦{profitMargin.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500 truncate">
                        {formatDate(product.updated_at)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          disabled={!isAdmin}
                        >
                          Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State for Mobile */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-5xl mb-4 text-gray-300">📦</div>
            <p className="text-lg mb-2">{searchTerm ? 'No matching products found' : 'No products in inventory'}</p>
            <p className="text-sm text-gray-400 mb-6">
              {searchTerm ? 'Try searching with different terms' : 'Start by adding products to your store'}
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>

      {/* Add Product Form Modal */}
      {showAddForm && (
        <ProductForm
          onSave={handleAddProduct}
          onCancel={() => {
            setShowAddForm(false);
            setActionError(null);
          }}
          onEditExisting={(prod) => {
            setShowAddForm(false);
            setEditingProduct(prod);
          }}
        />
      )}

      {/* Edit Product Form Modal */}
      {editingProduct && (
        <ProductForm
          product={editingProduct}
          onSave={handleEditProduct}
          onCancel={() => {
            setEditingProduct(null);
            setActionError(null);
          }}
        />
      )}
    </div>
  );
};

// ProductForm Component (Mobile Optimized)
interface ProductFormProps {
  product?: Product;
  onSave: (product: Product | Omit<Product, 'id'>) => Promise<void>;
  onCancel: () => void;
  onEditExisting?: (product: Product) => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSave, 
  onCancel, 
  onEditExisting 
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    buy_price: product?.buy_price || 0,
    sell_price: product?.sell_price || 0,
    stock: product?.stock || 0,
    category: product?.category || '',
    description: product?.description || '',
    barcode: product?.barcode || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [, setBarcodeLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const { 
    handleBarcodeScan, 
    scannedProduct, 
    clearScannedProduct,
    loading: barcodeScanLoading 
  } = useBarcode();

  // Auto-fill form when product is scanned
  useEffect(() => {
    if (scannedProduct && !product) {
      setFormData(prev => ({
        ...prev,
        name: scannedProduct.name,
        buy_price: scannedProduct.buy_price,
        sell_price: scannedProduct.sell_price,
        category: scannedProduct.category,
        description: scannedProduct.description || '',
        barcode: scannedProduct.barcode || prev.barcode
      }));
    }
  }, [scannedProduct, product]);

  // Handle barcode input
  const handleBarcodeInput = async (barcode: string) => {
    if (!barcode.trim()) return;
    
    setBarcodeLoading(true);
    setBarcodeError(null);
    
    try {
      await handleBarcodeScan(barcode);
    } catch (error) {
      setBarcodeError('Failed to process barcode');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Handle barcode field blur
  const handleBarcodeBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const barcode = e.target.value.trim();
    if (barcode && barcode !== product?.barcode) {
      handleBarcodeInput(barcode);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.sell_price < formData.buy_price) {
      alert('Selling price cannot be less than cost price!');
      return;
    }
    
    if (formData.buy_price < 0 || formData.sell_price < 0 || formData.stock < 0) {
      alert('Prices and stock cannot be negative!');
      return;
    }

    // Check for duplicate barcode when adding new product
    if (!product && formData.barcode) {
      try {
        const exists = await apiService.checkBarcodeExists(formData.barcode);
        if (exists.exists) {
          const useExisting = window.confirm(
            `Barcode "${formData.barcode}" already exists for product "${exists.product?.name}".\n\nDo you want to update the existing product instead?`
          );
          if (useExisting && exists.product) {
            onEditExisting?.(exists.product);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking barcode:', error);
      }
    }

    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with data:', formData);
      if (product) {
        await onSave({ ...formData, id: product.id });
      } else {
        await onSave(formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const profitMargin = formData.sell_price - formData.buy_price;
  const profitPercentage = formData.buy_price > 0 ? (profitMargin / formData.buy_price) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
        
        {/* Barcode Scanner Status */}
        {scannedProduct && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-blue-600 text-xl">✅</span>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Product Found: {scannedProduct.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {product ? 'Product details loaded' : 'Auto-filled product details'}
                  </p>
                </div>
              </div>
              <button
                onClick={clearScannedProduct}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 hover:bg-blue-100 rounded-lg"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {barcodeError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <span className="text-red-500 text-xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">
                  Barcode not found
                </p>
                <p className="text-xs text-red-600 mt-1">
                  This barcode is not available
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isSubmitting}
              placeholder="e.g., Paracetamol 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isSubmitting}
              placeholder="e.g., Analgesics, Antibiotics, Vitamins"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cost Price (₦) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.buy_price}
                onChange={(e) => setFormData({ ...formData, buy_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selling Price (₦) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sell_price}
                onChange={(e) => setFormData({ ...formData, sell_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Profit Margin Display */}
          {formData.buy_price > 0 && (
            <div className={`p-4 rounded-lg border ${
              profitMargin >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-700">Profit Margin:</span>
                  <span className={`font-bold text-lg ${profitMargin >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    ₦{profitMargin.toLocaleString()} ({profitPercentage.toFixed(1)}%)
                  </span>
                </div>
                {profitMargin < 0 && (
                  <div className="text-xs text-red-600">
                    ⚠️ Warning: Selling at a loss!
                  </div>
                )}
                {profitPercentage > 50 && (
                  <div className="text-xs text-blue-600">
                    ✅ Good profit margin!
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Barcode {!product && '(Scan with barcode scanner)'}
            </label>
            <div className="space-y-3">
              <input
                ref={barcodeInputRef}
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                onBlur={handleBarcodeBlur}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={isSubmitting}
                placeholder="Scan barcode or type manually"
                autoFocus={!product}
              />
              {barcodeScanLoading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Searching for product...</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                💡 Tip: Use your barcode scanner to quickly scan product barcodes. 
                The system will auto-fill product details if the barcode exists.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isSubmitting}
              placeholder="Product description, brand, or specifications..."
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                product ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;