'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Clock, DollarSign, Package, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Vendor {
  name: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryTime: number;
  discount: number;
  canFulfill: boolean;
}

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  productRequest?: string;
}

export function PreOrderModal({ isOpen, onClose, vendor, productRequest }: PreOrderModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  const handleConfirmOrder = async () => {
    setIsConfirming(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create order object
    const order = {
      id: `ORD-${Date.now()}`,
      vendor: vendor.name,
      productRequest: productRequest || 'Product Request',
      pricePerUnit: vendor.pricePerUnit,
      totalPrice: vendor.totalPrice,
      deliveryTime: vendor.deliveryTime,
      discount: vendor.discount,
      status: 'Confirmed',
      createdAt: new Date(),
      estimatedDelivery: new Date(Date.now() + vendor.deliveryTime * 24 * 60 * 60 * 1000)
    };

    // Save order to localStorage
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('orders', JSON.stringify(existingOrders));

    setIsConfirming(false);
    onClose();
    
    // Navigate to orders page
    router.push('/orders');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Confirm Pre-Order
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-lg text-green-800 dark:text-green-200">
                    {vendor.name}
                  </h3>
                  <Badge className="bg-green-600 text-white mt-1">Recommended Vendor</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Price per Unit:</span>
                  </div>
                  <div className="text-lg font-semibold">${vendor.pricePerUnit}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total Price:</span>
                  </div>
                  <div className="text-lg font-semibold">${vendor.totalPrice.toLocaleString()}</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Delivery Time:</span>
                  </div>
                  <div className="text-lg font-semibold">{vendor.deliveryTime} days</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Discount:</span>
                  </div>
                  <div className="text-lg font-semibold">{vendor.discount}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Request */}
          {productRequest && (
            <Card>
              <CardContent className="p-3 sm:p-4">
                <h4 className="font-semibold mb-2">Product Request</h4>
                <p className="text-muted-foreground">{productRequest}</p>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <h4 className="font-semibold mb-4">Order Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-medium">ORD-{Date.now()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span className="font-medium">
                    {new Date(Date.now() + vendor.deliveryTime * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                    Pending Confirmation
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isConfirming} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmOrder} 
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {isConfirming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Order
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 