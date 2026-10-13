import React from 'react';
import { useRoute } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useGetOrder } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function OrderStatus() {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id || '';
  const { t } = useLanguage();

  // Poll every 3 seconds if status is pending
  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      queryKey: ['getOrder', orderId],
      refetchInterval: (query) => {
        const orderData = query.state.data;
        return orderData?.status === 'pending' ? 3000 : false;
      }
    }
  });

  if (isLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-20 text-center text-muted-foreground">
        Order not found
      </div>
    );
  }

  const isPending = order.status === 'pending';
  const isPaidOrCompleted = order.status === 'paid' || order.status === 'completed';

  return (
    <div className="container max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold mb-2">{t('order_status')}</h1>
        <p className="text-muted-foreground font-medium">
          {t('order_id')}: <span className="font-mono">{order.id.slice(0, 8)}</span>
        </p>
      </div>

      <Card className="border-border overflow-hidden">
        <div className={`p-4 flex items-center justify-center gap-2 font-medium text-sm
          ${isPending ? 'bg-secondary text-secondary-foreground' : 
            isPaidOrCompleted ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-[#16A34A]' : 
            'bg-destructive/10 text-destructive'}`
        }>
          {isPending && <Clock className="w-5 h-5" />}
          {isPaidOrCompleted && <CheckCircle2 className="w-5 h-5" />}
          {order.status === 'failed' && <AlertCircle className="w-5 h-5" />}
          {t(`status_${order.status}`)}
        </div>

        <CardContent className="p-8">
          <div className="flex justify-between items-center pb-6 border-b border-border/50 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">{t('price')}</p>
              <p className="text-xl font-bold">{formatCurrency(order.totalPrice)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">User</p>
              <p className="font-medium text-foreground">{order.customerName}</p>
            </div>
          </div>

          {isPending && order.qpayQrImage && (
            <div className="flex flex-col items-center text-center">
              <h3 className="font-semibold text-lg mb-6">{t('scan_qr_to_pay')}</h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block mb-6">
                <img src={`data:image/png;base64,${order.qpayQrImage}`} alt="QPay QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse flex items-center">
                <Clock className="w-4 h-4 mr-2" /> Waiting for payment...
              </p>
            </div>
          )}

          {isPaidOrCompleted && order.esimQrCode && (
            <div className="flex flex-col items-center text-center">
              <h3 className="font-semibold text-lg mb-6 text-foreground flex items-center gap-2">
                <QrCode className="w-5 h-5" /> {t('your_esim')}
              </h3>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-border inline-block mb-6">
                <img src={`data:image/png;base64,${order.esimQrCode}`} alt="eSIM QR Code" className="w-56 h-56" />
              </div>
              <p className="text-sm font-medium mb-1">{t('scan_to_install')}</p>
              {order.esimIccid && (
                <p className="text-xs text-muted-foreground font-mono">ICCID: {order.esimIccid}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
