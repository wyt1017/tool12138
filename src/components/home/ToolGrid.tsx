import { tools, categories } from '@/data/tools';
import ToolCard from './ToolCard';

export default function ToolGrid() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      {/* Section Header */}
      <div className="text-center mb-14">
        <h2 className="font-['Syne'] font-bold text-3xl sm:text-4xl text-white mb-4">
          全部工具
        </h2>
        <p className="text-[#a8b2c1] max-w-lg mx-auto">
          选择你需要的工具，一键使用，无需注册安装
        </p>
      </div>

      {/* Category Tabs & Grid */}
      {categories.map((cat) => {
        const catTools = tools.filter((t) => t.category === cat.key);
        if (catTools.length === 0) return null;
        return (
          <div key={cat.key} className="mb-12 last:mb-0">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <h3 className="font-['Syne'] font-semibold text-lg text-white">{cat.label}</h3>
              <span className="text-sm text-[#555]">({catTools.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {catTools.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
