'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Zap, TrendingUp, Clock, DollarSign, Truck } from 'lucide-react';

interface RequestHelperProps {
  onSendRequest: (request: string) => void;
}

const requestTemplates = [
  {
    id: 'urgent-delivery',
    title: 'Urgent Delivery',
    description: 'Get quotes for products with fast delivery',
    icon: Zap,
    examples: [
      'I need 100 Adidas shoes delivered to Miami within 3 days',
      'Urgent quote for 50 laptops with next-day delivery to New York',
      'Fast delivery quote for 200 T-shirts to Los Angeles'
    ]
  },
  {
    id: 'bulk-order',
    title: 'Bulk Order',
    description: 'Large quantity orders with volume discounts',
    icon: TrendingUp,
    examples: [
      'Bulk order quote for 1000 smartphones with volume pricing',
      'Large quantity order for 500 laptops with bulk discounts',
      'Massive order for 2000 tablets with wholesale pricing'
    ]
  },
  {
    id: 'budget-friendly',
    title: 'Budget Friendly',
    description: 'Find the most cost-effective options',
    icon: DollarSign,
    examples: [
      'Best price quote for 100 laptops under $50,000',
      'Budget-friendly options for 200 smartphones',
      'Cost-effective quote for 500 tablets with best pricing'
    ]
  },
  {
    id: 'specific-timing',
    title: 'Specific Timing',
    description: 'Orders with specific delivery requirements',
    icon: Clock,
    examples: [
      'Quote for 100 laptops delivered to Chicago by December 15th',
      'Order for 200 smartphones with delivery to Miami in 2 weeks',
      'Products needed in Los Angeles by end of month'
    ]
  },
  {
    id: 'logistics',
    title: 'Logistics Focus',
    description: 'Complex delivery and logistics requirements',
    icon: Truck,
    examples: [
      'Quote for 500 laptops with international shipping to Mexico',
      'Logistics quote for 1000 smartphones with customs handling',
      'Complex delivery for 200 tablets to multiple locations'
    ]
  }
];

export function RequestHelper({ onSendRequest }: RequestHelperProps) {
  return (
    <Card className="bg-muted/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Request Templates
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose a template to get started quickly, or create your own custom request
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {requestTemplates.map((template) => (
            <div key={template.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <template.icon className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-sm">{template.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {template.description}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.examples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onSendRequest(example)}
                    className="text-xs h-auto py-1 px-2 whitespace-normal text-left"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 