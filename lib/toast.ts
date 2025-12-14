/**
 * Toast 通知系统安全包装器
 * 提供 toast 通知的统一接口，带有 alert() 降级回退
 * 确保即使 react-hot-toast 出现问题，用户仍能收到通知
 */

import toast, { Toaster as HotToaster } from 'react-hot-toast';

/**
 * 安全的 Toast 通知包装器
 * 如果 toast 失败，自动降级到 alert()
 */
class SafeToast {
  success(message: string) {
    try {
      toast.success(message, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      console.error('Toast error, fallback to alert:', error);
      alert(`✅ ${message}`);
    }
  }

  error(message: string) {
    try {
      toast.error(message, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      console.error('Toast error, fallback to alert:', error);
      alert(`❌ ${message}`);
    }
  }

  loading(message: string) {
    try {
      return toast.loading(message, {
        position: 'top-center',
        style: {
          background: '#3b82f6',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      console.error('Toast error:', error);
      return null;
    }
  }

  dismiss(toastId?: string) {
    try {
      toast.dismiss(toastId);
    } catch (error) {
      console.error('Toast dismiss error:', error);
    }
  }

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    try {
      return toast.promise(promise, messages, {
        position: 'top-center',
        style: {
          padding: '12px 20px',
          borderRadius: '8px',
        },
      });
    } catch (error) {
      console.error('Toast promise error:', error);
      // 降级：只处理最终结果
      promise
        .then((data) => {
          const successMsg = typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
          alert(`✅ ${successMsg}`);
        })
        .catch((err) => {
          const errorMsg = typeof messages.error === 'function'
            ? messages.error(err)
            : messages.error;
          alert(`❌ ${errorMsg}`);
        });
      return promise;
    }
  }
}

// 导出单例
export const safeToast = new SafeToast();

// 导出 Toaster 组件
export { HotToaster as Toaster };

/**
 * 使用示例：
 *
 * 1. 成功消息：
 * import { safeToast } from '@/lib/toast';
 * safeToast.success('操作成功！');
 *
 * 2. 错误消息：
 * safeToast.error('操作失败，请重试');
 *
 * 3. 加载状态：
 * const toastId = safeToast.loading('处理中...');
 * // ... 执行操作
 * safeToast.dismiss(toastId);
 * safeToast.success('完成！');
 *
 * 4. Promise 包装：
 * safeToast.promise(
 *   fetchData(),
 *   {
 *     loading: '加载中...',
 *     success: '加载成功！',
 *     error: '加载失败'
 *   }
 * );
 *
 * 5. 在 app/layout.tsx 中添加 Toaster：
 * import { Toaster } from '@/lib/toast';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   );
 * }
 */
