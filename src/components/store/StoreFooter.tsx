import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

type Props = {
  storeName: string;
  onTrackOrder?: () => void;
};

export default function StoreFooter({ storeName, onTrackOrder }: Props) {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-16">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-900 grid place-items-center">
                <Zap className="h-4 w-4 text-[#FFCC00]" />
              </div>
              <span className="font-display font-bold text-zinc-900">ByteBoss</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
              Buy MTN, Telecel and AirtelTigo bundles in seconds through {storeName}. Top up your wallet, save your numbers, order again with one tap.
            </p>
            <p className="text-xs text-zinc-400 mt-4">Built in Ghana 🇬🇭</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900 mb-3">For customers</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#bundles" className="hover:text-zinc-900 transition-colors">Browse bundles</a></li>
              <li><Link to="/auth?mode=signup" className="hover:text-zinc-900 transition-colors">Create an account</Link></li>
              {onTrackOrder ? (
                <li><button type="button" onClick={onTrackOrder} className="hover:text-zinc-900 transition-colors">Track an order</button></li>
              ) : (
                <li><Link to="/auth" className="hover:text-zinc-900 transition-colors">My orders</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900 mb-3">Why ByteBoss</h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>1–5 min delivery</li>
              <li>Auto-refund on failed orders</li>
              <li>Open 24/7</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} {storeName}. Powered by ByteBoss.</span>
          <div className="flex gap-4">
            <Link to="/auth" className="hover:text-zinc-600">Terms</Link>
            <Link to="/auth" className="hover:text-zinc-600">Privacy</Link>
            <Link to="/auth" className="hover:text-zinc-600">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
