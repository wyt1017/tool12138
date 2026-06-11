import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Package,
} from 'lucide-react';

const COLOR = '#e94560';

interface ProductRecord {
  id: number;
  name: string;
  productionDate: string;
  shelfLife: number;
  shelfUnit: 'day' | 'week' | 'month' | 'year';
}

type ExpiryStatus = 'fresh' | 'warning' | 'expired';

function calculateExpiryDate(productionDate: string, amount: number, unit: string): Date {
  const date = new Date(productionDate);
  switch (unit) {
    case 'day':
      date.setDate(date.getDate() + amount);
      break;
    case 'week':
      date.setDate(date.getDate() + amount * 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() + amount);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() + amount);
      break;
  }
  return date;
}

function getExpiryStatus(expiryDate: Date): ExpiryStatus {
  const now = new Date();
  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 7) return 'warning';
  return 'fresh';
}

function getDaysRemaining(expiryDate: Date): number {
  const now = new Date();
  return Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<ExpiryStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  fresh: { label: '新鲜', color: '#6bcb77', bgColor: '#6bcb77/10', icon: CheckCircle2 },
  warning: { label: '即将过期', color: '#ffd369', bgColor: '#ffd369/10', icon: AlertTriangle },
  expired: { label: '已过期', color: '#e94560', bgColor: '#e94560/10', icon: AlertTriangle },
};

export default function ExpiryCalculator() {
  const today = new Date().toISOString().split('T')[0];

  const [products, setProducts] = useState<ProductRecord[]>([
    { id: 1, name: '', productionDate: today, shelfLife: 30, shelfUnit: 'day' },
  ]);
  const [nextId, setNextId] = useState(2);

  const addProduct = () => {
    setProducts([...products, { id: nextId, name: '', productionDate: today, shelfLife: 30, shelfUnit: 'day' }]);
    setNextId(nextId + 1);
  };

  const removeProduct = (id: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const updateProduct = (id: number, field: keyof ProductRecord, value: unknown) => {
    setProducts(
      products.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const processedProducts = useMemo(() => {
    return products
      .map((product) => {
        if (!product.productionDate || product.shelfLife <= 0) {
          return null;
        }
        const expiryDate = calculateExpiryDate(product.productionDate, product.shelfLife, product.shelfUnit);
        const status = getExpiryStatus(expiryDate);
        const daysRemaining = getDaysRemaining(expiryDate);
        return { ...product, expiryDate: expiryDate.toISOString().split('T')[0], status, daysRemaining };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      }) as (ProductRecord & { expiryDate: string; status: ExpiryStatus; daysRemaining: number })[];
  }, [products]);

  const soonestExpiring = useMemo(() => {
    if (processedProducts.length === 0) return null;
    const valid = processedProducts.filter((p) => p.status !== 'expired');
    if (valid.length === 0) return processedProducts[0];
    return valid[0];
  }, [processedProducts]);

  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <CalendarClock size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">保质期计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算产品过期日期，管理多条产品记录</p>
      </motion.div>

      {/* Input Area - Product List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package size={18} style={{ color: COLOR }} /> 产品列表
          </h2>
          <button onClick={addProduct} className="btn-primary !py-1.5 !px-4 text-xs flex items-center gap-1.5">
            <Plus size={14} /> 添加产品
          </button>
        </div>

        <div className="space-y-3">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-12 gap-3 items-end bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
            >
              {/* Product Name */}
              <div className="col-span-12 sm:col-span-3">
                <label className="text-xs text-[#666] block mb-1.5">产品名称</label>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                  placeholder={`产品 ${index + 1}`}
                  aria-label="产品名称"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#e94560]/50 placeholder:text-[#444]"
                />
              </div>

              {/* Production Date */}
              <div className="col-span-6 sm:col-span-2">
                <label className="text-xs text-[#666] block mb-1.5">生产日期</label>
                <input
                  type="date"
                  value={product.productionDate}
                  onChange={(e) => updateProduct(product.id, 'productionDate', e.target.value)}
                  max={today}
                  aria-label="生产日期"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#e94560]/50 [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              {/* Shelf Life Amount */}
              <div className="col-span-3 sm:col-span-2">
                <label className="text-xs text-[#666] block mb-1.5">保质期</label>
                <input
                  type="number"
                  min={1}
                  value={product.shelfLife}
                  onChange={(e) => updateProduct(product.id, 'shelfLife', parseInt(e.target.value) || 1)}
                  aria-label="保质期"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#e94560]/50"
                />
              </div>

              {/* Unit Selector */}
              <div className="col-span-6 sm:col-span-2">
                <label className="text-xs text-[#666] block mb-1.5">单位</label>
                <select
                  value={product.shelfUnit}
                  onChange={(e) => updateProduct(product.id, 'shelfUnit', e.target.value)}
                  aria-label="保质期单位"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#e94560]/50 appearance-none cursor-pointer"
                >
                  <option value="day" className="bg-[#0a0a1a]">天</option>
                  <option value="week" className="bg-[#0a0a1a]">周</option>
                  <option value="month" className="bg-[#0a0a1a]">月</option>
                  <option value="year" className="bg-[#0a0a1a]">年</option>
                </select>
              </div>

              {/* Remove Button */}
              <div className="col-span-12 sm:col-span-3 flex justify-end">
                {products.length > 1 && (
                  <button onClick={() => removeProduct(product.id)} className="btn-secondary !py-2 !px-3 text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      {processedProducts.length > 0 && (
        <>
          {/* Warning Banner for Soonest Expiring */}
          {soonestExpiring && soonestExpiring.status !== 'fresh' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${STATUS_CONFIG[soonestExpiring.status].bgColor} border ${
                soonestExpiring.status === 'expired' ? 'border-[#e94560]/30' : 'border-[#ffd369]/30'
              } rounded-xl p-4 mb-6 flex items-center gap-3`}
            >
              <AlertTriangle size={20} className={STATUS_CONFIG[soonestExpiring.status].color} />
              <div>
                <span className="font-semibold text-white">{soonestExpiring.name || `产品`}</span>
                <span className="text-[#a8b2c1] ml-2">
                  {soonestExpiring.status === 'expired'
                    ? `已过期 ${Math.abs(soonestExpiring.daysRemaining)} 天`
                    : `即将在 ${soonestExpiring.daysRemaining} 天后过期`}
                </span>
              </div>
            </motion.div>
          )}

          {/* Result Cards */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ArrowUpDown size={18} style={{ color: COLOR }} /> 计算结果（按过期时间排序）
              </h2>
              <span className="text-xs text-[#666]">共 {processedProducts.length} 条记录</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedProducts.map((product) => {
                const config = STATUS_CONFIG[product.status];
                const StatusIcon = config.icon;
                return (
                  <div
                    key={product.id}
                    className={`glass-card p-5 border-l-4 ${
                      product.status === 'fresh'
                        ? 'border-l-[#6bcb77]'
                        : product.status === 'warning'
                          ? 'border-l-[#ffd369]'
                          : 'border-l-[#e94560]'
                    } hover:bg-white/[0.04] transition-all`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-base">{product.name || `产品 #${product.id}`}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon size={14} style={{ color: config.color }} />
                          <span className="text-xs font-medium" style={{ color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#666]">生产日期</span>
                        <span className="text-[#a8b2c1] font-mono">{formatDisplayDate(product.productionDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666]">保质期</span>
                        <span className="text-[#a8b2c1]">
                          {product.shelfLife}
                          {product.shelfUnit === 'day' ? '天' : product.shelfUnit === 'week' ? '周' : product.shelfUnit === 'month' ? '个月' : '年'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666]">过期日期</span>
                        <span className="text-white font-medium font-mono">{formatDisplayDate(product.expiryDate)}</span>
                      </div>
                      <div className="h-px bg-white/5 my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] flex items-center gap-1.5">
                          <Clock size={13} /> 剩余
                        </span>
                        <span className={`font-bold font-mono ${product.status === 'expired' ? 'text-[#e94560]' : product.status === 'warning' ? 'text-[#ffd369]' : 'text-[#6bcb77]'}`}>
                          {product.daysRemaining > 0 ? `还剩 ${product.daysRemaining} 天` : `已过期 ${Math.abs(product.daysRemaining)} 天`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}

      {processedProducts.length === 0 && products.some((p) => p.name || p.productionDate !== today) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center">
          <p className="text-[#555] text-sm">请完善产品信息以计算过期时间</p>
        </motion.div>
      )}
    </div>
  );
}
