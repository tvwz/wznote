// Cloudflare Workers 代码 (index.js)
const MEMO_DATA_KEY = 'shared_memo_data';

// 处理CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 主处理函数
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  
  // 路由处理
  switch (path) {
    case '/api/save':
      return handleSave(request);
    case '/api/load':
      return handleLoad(request);
    case '/api/delete':
      return handleDelete(request);
    default:
      // 如果是根路径，返回HTML页面
      if (path === '/' || path === '/index.html') {
        return new Response(HTML_CONTENT, {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            ...corsHeaders,
          },
        });
      }
      return new Response('Not Found', { status: 404 });
  }
}

// 保存数据
async function handleSave(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    const password = authHeader.substring(7);
    const data = await request.json();
    
    // 使用密码作为KV命名空间的一部分，实现多用户隔离
    const kvKey = `${password}:${MEMO_DATA_KEY}`;
    
    // 保存到Cloudflare KV
    await MEMO_KV.put(kvKey, JSON.stringify(data));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 加载数据
async function handleLoad(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    const password = authHeader.substring(7);
    const kvKey = `${password}:${MEMO_DATA_KEY}`;
    
    // 从Cloudflare KV加载数据
    const data = await MEMO_KV.get(kvKey);
    
    if (data) {
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } else {
      return new Response(JSON.stringify({ memos: [], categories: [] }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 删除数据
async function handleDelete(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    const password = authHeader.substring(7);
    const kvKey = `${password}:${MEMO_DATA_KEY}`;
    
    // 从Cloudflare KV删除数据
    await MEMO_KV.delete(kvKey);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// 主事件监听器
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// HTML内容（将上面的HTML代码放在这里）
const HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多设备共享备忘录</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
        }
        
        :root {
            --primary-color: #4361ee;
            --secondary-color: #3a0ca3;
            --accent-color: #4cc9f0;
            --light-color: #f8f9fa;
            --dark-color: #212529;
            --success-color: #4ade80;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --gray-color: #6c757d;
            --border-radius: 12px;
            --box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }
        
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            color: var(--dark-color);
            min-height: 100vh;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .container {
            width: 100%;
            max-width: 1200px;
            height: calc(100vh - 40px);
            display: flex;
            flex-direction: column;
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            overflow: hidden;
        }
        
        /* 头部样式 */
        header {
            background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
            color: white;
            padding: 20px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo i {
            font-size: 28px;
        }
        
        .logo h1 {
            font-size: 24px;
            font-weight: 700;
        }
        
        .auth-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .password-input {
            padding: 10px 15px;
            border: none;
            border-radius: 30px;
            width: 200px;
            font-size: 14px;
            background-color: rgba(255, 255, 255, 0.9);
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 30px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        
        .btn-primary {
            background-color: var(--accent-color);
            color: white;
        }
        
        .btn-primary:hover {
            background-color: #3ab8d8;
            transform: translateY(-2px);
        }
        
        .btn-success {
            background-color: var(--success-color);
            color: white;
        }
        
        .btn-success:hover {
            background-color: #22c55e;
        }
        
        .btn-danger {
            background-color: var(--danger-color);
            color: white;
        }
        
        .btn-danger:hover {
            background-color: #dc2626;
        }
        
        .btn-outline {
            background-color: transparent;
            border: 2px solid white;
            color: white;
        }
        
        .btn-outline:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        /* 主要内容区域 */
        main {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        
        /* 侧边栏 - 分类管理 */
        .sidebar {
            width: 280px;
            background-color: #f8fafc;
            border-right: 1px solid #e2e8f0;
            padding: 20px;
            overflow-y: auto;
            flex-shrink: 0;
        }
        
        .categories-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .categories-header h2 {
            font-size: 18px;
            color: var(--dark-color);
        }
        
        .categories-list {
            list-style: none;
            margin-bottom: 30px;
        }
        
        .category-item {
            padding: 12px 15px;
            margin-bottom: 8px;
            background-color: white;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: var(--transition);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        
        .category-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .category-item.active {
            background-color: #e0e7ff;
            border-left-color: var(--accent-color);
        }
        
        .category-name {
            font-weight: 600;
            flex: 1;
        }
        
        .category-count {
            background-color: var(--primary-color);
            color: white;
            border-radius: 20px;
            padding: 2px 10px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .category-actions {
            display: flex;
            gap: 5px;
            opacity: 0;
            transition: var(--transition);
        }
        
        .category-item:hover .category-actions {
            opacity: 1;
        }
        
        .category-action-btn {
            background: none;
            border: none;
            color: var(--gray-color);
            cursor: pointer;
            font-size: 14px;
            padding: 4px;
            border-radius: 4px;
        }
        
        .category-action-btn:hover {
            color: var(--primary-color);
            background-color: rgba(0, 0, 0, 0.05);
        }
        
        /* 主内容区域 */
        .content {
            flex: 1;
            padding: 25px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        
        .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .content-header h2 {
            font-size: 22px;
            color: var(--dark-color);
        }
        
        .current-category {
            color: var(--primary-color);
        }
        
        /* 备忘录列表 */
        .memo-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .memo-item {
            background-color: white;
            border-radius: var(--border-radius);
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: var(--transition);
            border: 1px solid #e9ecef;
            display: flex;
            flex-direction: column;
        }
        
        .memo-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }
        
        .memo-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }
        
        .memo-date {
            font-size: 12px;
            color: var(--gray-color);
        }
        
        .memo-actions {
            display: flex;
            gap: 8px;
        }
        
        .memo-text {
            margin-bottom: 15px;
            line-height: 1.6;
            flex: 1;
            white-space: pre-wrap;
            word-break: break-word;
        }
        
        .memo-image-container {
            margin-top: 10px;
            border-radius: 8px;
            overflow: hidden;
            max-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .memo-image {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .memo-image:hover {
            transform: scale(1.03);
        }
        
        .memo-category {
            display: inline-block;
            background-color: #e0e7ff;
            color: var(--primary-color);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 15px;
            align-self: flex-start;
        }
        
        /* 添加备忘录表单 */
        .add-memo-form {
            background-color: white;
            border-radius: var(--border-radius);
            padding: 25px;
            box-shadow: var(--box-shadow);
            margin-top: auto;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--dark-color);
        }
        
        .form-control {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            font-size: 15px;
            transition: var(--transition);
        }
        
        .form-control:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }
        
        textarea.form-control {
            min-height: 100px;
            resize: vertical;
            font-family: inherit;
        }
        
        .form-row {
            display: flex;
            gap: 15px;
        }
        
        .form-row .form-group {
            flex: 1;
        }
        
        /* 图片放大模态框 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: var(--transition);
        }
        
        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background-color: white;
            border-radius: var(--border-radius);
            max-width: 90%;
            max-height: 90%;
            position: relative;
            transform: scale(0.9);
            transition: var(--transition);
        }
        
        .modal-overlay.active .modal-content {
            transform: scale(1);
        }
        
        .modal-image {
            max-width: 100%;
            max-height: 80vh;
            display: block;
            border-radius: var(--border-radius);
        }
        
        .modal-close {
            position: absolute;
            top: 15px;
            right: 15px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            font-size: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }
        
        .modal-close:hover {
            background-color: rgba(0, 0, 0, 0.9);
        }
        
        .modal-actions {
            position: absolute;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        }
        
        /* 分类编辑模态框 */
        .category-modal {
            max-width: 500px;
            width: 90%;
            padding: 30px;
        }
        
        /* 密码验证模态框 */
        .auth-modal {
            max-width: 400px;
            width: 90%;
            padding: 40px 30px;
            text-align: center;
        }
        
        .auth-modal h2 {
            margin-bottom: 20px;
            color: var(--primary-color);
        }
        
        .auth-modal p {
            margin-bottom: 25px;
            color: var(--gray-color);
        }
        
        /* 空状态 */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--gray-color);
        }
        
        .empty-state i {
            font-size: 60px;
            margin-bottom: 20px;
            color: #dbeafe;
        }
        
        .empty-state h3 {
            font-size: 22px;
            margin-bottom: 10px;
            color: var(--dark-color);
        }
        
        /* 响应式设计 */
        @media (max-width: 992px) {
            .container {
                height: auto;
                min-height: calc(100vh - 40px);
            }
            
            main {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid #e2e8f0;
                max-height: 300px;
            }
            
            .memo-list {
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            }
        }
        
        @media (max-width: 768px) {
            header {
                flex-direction: column;
                gap: 15px;
                padding: 15px;
            }
            
            .auth-section {
                width: 100%;
                justify-content: center;
            }
            
            .password-input {
                width: 100%;
                max-width: 250px;
            }
            
            .memo-list {
                grid-template-columns: 1fr;
            }
            
            .form-row {
                flex-direction: column;
                gap: 0;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .container {
                height: auto;
                min-height: calc(100vh - 20px);
            }
            
            .content {
                padding: 15px;
            }
            
            .btn {
                padding: 8px 15px;
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 头部 -->
        <header>
            <div class="logo">
                <i class="fas fa-sticky-note"></i>
                <h1>多设备共享备忘录</h1>
            </div>
            <div class="auth-section">
                <input type="password" class="password-input" id="passwordInput" placeholder="输入访问密码">
                <button class="btn btn-primary" id="loginBtn">
                    <i class="fas fa-lock"></i> 验证
                </button>
                <button class="btn btn-outline" id="logoutBtn" style="display: none;">
                    <i class="fas fa-sign-out-alt"></i> 退出
                </button>
            </div>
        </header>
        
        <!-- 主内容区域 -->
        <main id="mainContent" style="display: none;">
            <!-- 侧边栏 - 分类管理 -->
            <div class="sidebar">
                <div class="categories-header">
                    <h2><i class="fas fa-folder"></i> 分类管理</h2>
                    <button class="btn btn-primary" id="addCategoryBtn">
                        <i class="fas fa-plus"></i> 添加分类
                    </button>
                </div>
                
                <ul class="categories-list" id="categoriesList">
                    <!-- 分类将通过JS动态生成 -->
                </ul>
                
                <div class="form-group">
                    <label for="categoryFilter"><i class="fas fa-filter"></i> 筛选分类</label>
                    <select class="form-control" id="categoryFilter">
                        <option value="all">所有分类</option>
                        <!-- 分类选项将通过JS动态生成 -->
                    </select>
                </div>
            </div>
            
            <!-- 主内容 -->
            <div class="content">
                <div class="content-header">
                    <h2>备忘录 <span class="current-category" id="currentCategory">(所有分类)</span></h2>
                    <button class="btn btn-success" id="addMemoBtn">
                        <i class="fas fa-plus"></i> 添加备忘录
                    </button>
                </div>
                
                <!-- 备忘录列表 -->
                <div class="memo-list" id="memoList">
                    <!-- 备忘录将通过JS动态生成 -->
                </div>
                
                <!-- 空状态 -->
                <div class="empty-state" id="emptyState">
                    <i class="fas fa-sticky-note"></i>
                    <h3>暂无备忘录</h3>
                    <p>点击"添加备忘录"按钮创建您的第一条备忘录</p>
                </div>
                
                <!-- 添加/编辑备忘录表单 -->
                <div class="add-memo-form" id="memoForm" style="display: none;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-edit"></i> <span id="formTitle">添加备忘录</span></h3>
                    <div class="form-group">
                        <label for="memoTitle">标题</label>
                        <input type="text" class="form-control" id="memoTitle" placeholder="输入备忘录标题">
                    </div>
                    <div class="form-group">
                        <label for="memoContent">内容</label>
                        <textarea class="form-control" id="memoContent" placeholder="输入备忘录内容..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="memoCategory">分类</label>
                            <select class="form-control" id="memoCategory">
                                <!-- 分类选项将通过JS动态生成 -->
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="memoImage">上传图片 (可选)</label>
                            <input type="file" class="form-control" id="memoImage" accept="image/*">
                        </div>
                    </div>
                    <div class="form-group" id="imagePreviewContainer" style="display: none;">
                        <label>图片预览</label>
                        <div id="imagePreview"></div>
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: flex-end;">
                        <button class="btn btn-outline" id="cancelMemoBtn" style="color: var(--gray-color); border-color: var(--gray-color);">
                            取消
                        </button>
                        <button class="btn btn-primary" id="saveMemoBtn">
                            <i class="fas fa-save"></i> 保存备忘录
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>
    
    <!-- 图片放大模态框 -->
    <div class="modal-overlay" id="imageModal">
        <div class="modal-content">
            <button class="modal-close" id="closeModalBtn">
                <i class="fas fa-times"></i>
            </button>
            <img class="modal-image" id="modalImage" src="" alt="放大图片">
            <div class="modal-actions">
                <button class="btn btn-primary" id="downloadImageBtn">
                    <i class="fas fa-download"></i> 下载图片
                </button>
            </div>
        </div>
    </div>
    
    <!-- 分类编辑模态框 -->
    <div class="modal-overlay" id="categoryModal">
        <div class="modal-content category-modal">
            <button class="modal-close" id="closeCategoryModalBtn">
                <i class="fas fa-times"></i>
            </button>
            <h3 style="margin-bottom: 20px;"><i class="fas fa-folder"></i> <span id="categoryModalTitle">添加分类</span></h3>
            <div class="form-group">
                <label for="categoryName">分类名称</label>
                <input type="text" class="form-control" id="categoryName" placeholder="输入分类名称">
            </div>
            <div class="form-group">
                <label for="categoryColor">分类颜色</label>
                <input type="color" class="form-control" id="categoryColor" value="#4361ee" style="height: 50px;">
            </div>
            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px;">
                <button class="btn btn-outline" id="cancelCategoryBtn" style="color: var(--gray-color); border-color: var(--gray-color);">
                    取消
                </button>
                <button class="btn btn-danger" id="deleteCategoryBtn" style="display: none;">
                    <i class="fas fa-trash"></i> 删除分类
                </button>
                <button class="btn btn-primary" id="saveCategoryBtn">
                    <i class="fas fa-save"></i> 保存分类
                </button>
            </div>
        </div>
    </div>
    
    <!-- 密码验证模态框 -->
    <div class="modal-overlay active" id="authModal">
        <div class="modal-content auth-modal">
            <h2><i class="fas fa-lock"></i> 访问验证</h2>
            <p>请输入访问密码以使用多设备共享备忘录</p>
            <div class="form-group" style="margin-bottom: 25px;">
                <input type="password" class="form-control" id="authPassword" placeholder="输入访问密码" style="text-align: center;">
            </div>
            <button class="btn btn-primary" id="authSubmitBtn" style="width: 100%;">
                <i class="fas fa-unlock"></i> 验证并进入
            </button>
            <p style="margin-top: 20px; font-size: 14px; color: var(--gray-color);">
                首次使用请设置一个密码，之后使用相同密码访问
            </p>
        </div>
    </div>
    
    <script>
        // 应用状态
        const AppState = {
            isAuthenticated: false,
            currentCategory: 'all',
            editingMemoId: null,
            editingCategoryId: null,
            memos: [],
            categories: [
                { id: 'default', name: '默认', color: '#4361ee', count: 0 }
            ],
            password: null
        };
        
        // DOM元素
        const elements = {
            // 认证相关
            authModal: document.getElementById('authModal'),
            authPassword: document.getElementById('authPassword'),
            authSubmitBtn: document.getElementById('authSubmitBtn'),
            passwordInput: document.getElementById('passwordInput'),
            loginBtn: document.getElementById('loginBtn'),
            logoutBtn: document.getElementById('logoutBtn'),
            mainContent: document.getElementById('mainContent'),
            
            // 分类相关
            categoriesList: document.getElementById('categoriesList'),
            categoryFilter: document.getElementById('categoryFilter'),
            addCategoryBtn: document.getElementById('addCategoryBtn'),
            categoryModal: document.getElementById('categoryModal'),
            categoryModalTitle: document.getElementById('categoryModalTitle'),
            categoryName: document.getElementById('categoryName'),
            categoryColor: document.getElementById('categoryColor'),
            saveCategoryBtn: document.getElementById('saveCategoryBtn'),
            deleteCategoryBtn: document.getElementById('deleteCategoryBtn'),
            cancelCategoryBtn: document.getElementById('cancelCategoryBtn'),
            closeCategoryModalBtn: document.getElementById('closeCategoryModalBtn'),
            
            // 备忘录相关
            memoList: document.getElementById('memoList'),
            emptyState: document.getElementById('emptyState'),
            currentCategory: document.getElementById('currentCategory'),
            addMemoBtn: document.getElementById('addMemoBtn'),
            memoForm: document.getElementById('memoForm'),
            formTitle: document.getElementById('formTitle'),
            memoTitle: document.getElementById('memoTitle'),
            memoContent: document.getElementById('memoContent'),
            memoCategory: document.getElementById('memoCategory'),
            memoImage: document.getElementById('memoImage'),
            imagePreviewContainer: document.getElementById('imagePreviewContainer'),
            imagePreview: document.getElementById('imagePreview'),
            saveMemoBtn: document.getElementById('saveMemoBtn'),
            cancelMemoBtn: document.getElementById('cancelMemoBtn'),
            
            // 图片模态框
            imageModal: document.getElementById('imageModal'),
            modalImage: document.getElementById('modalImage'),
            closeModalBtn: document.getElementById('closeModalBtn'),
            downloadImageBtn: document.getElementById('downloadImageBtn')
        };
        
        // 初始化应用
        function initApp() {
            // 检查本地存储中是否有密码
            const savedPassword = localStorage.getItem('memoPassword');
            if (savedPassword) {
                AppState.password = savedPassword;
                elements.authPassword.placeholder = '输入已设置的密码';
            }
            
            // 加载数据
            loadData();
            
            // 绑定事件监听器
            bindEvents();
            
            // 更新UI
            updateCategoriesUI();
            updateMemosUI();
        }
        
        // 绑定事件监听器
        function bindEvents() {
            // 认证事件
            elements.authSubmitBtn.addEventListener('click', handleAuthSubmit);
            elements.authPassword.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleAuthSubmit();
            });
            
            elements.loginBtn.addEventListener('click', handleLogin);
            elements.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleLogin();
            });
            elements.logoutBtn.addEventListener('click', handleLogout);
            
            // 分类事件
            elements.addCategoryBtn.addEventListener('click', () => openCategoryModal());
            elements.saveCategoryBtn.addEventListener('click', saveCategory);
            elements.deleteCategoryBtn.addEventListener('click', deleteCategory);
            elements.cancelCategoryBtn.addEventListener('click', () => closeCategoryModal());
            elements.closeCategoryModalBtn.addEventListener('click', () => closeCategoryModal());
            elements.categoryFilter.addEventListener('change', (e) => {
                AppState.currentCategory = e.target.value;
                updateMemosUI();
            });
            
            // 备忘录事件
            elements.addMemoBtn.addEventListener('click', () => openMemoForm());
            elements.saveMemoBtn.addEventListener('click', saveMemo);
            elements.cancelMemoBtn.addEventListener('click', () => closeMemoForm());
            elements.memoImage.addEventListener('change', handleImageUpload);
            
            // 图片模态框事件
            elements.closeModalBtn.addEventListener('click', () => closeImageModal());
            elements.downloadImageBtn.addEventListener('click', downloadImage);
            elements.imageModal.addEventListener('click', (e) => {
                if (e.target === elements.imageModal) closeImageModal();
            });
            
            // 分类模态框事件
            elements.categoryModal.addEventListener('click', (e) => {
                if (e.target === elements.categoryModal) closeCategoryModal();
            });
            
            // 认证模态框事件
            elements.authModal.addEventListener('click', (e) => {
                if (e.target === elements.authModal) {
                    // 阻止关闭，必须验证密码
                }
            });
        }
        
        // 认证处理
        function handleAuthSubmit() {
            const password = elements.authPassword.value.trim();
            if (!password) {
                alert('请输入访问密码');
                return;
            }
            
            // 如果是首次使用，保存密码
            if (!AppState.password) {
                localStorage.setItem('memoPassword', password);
                AppState.password = password;
            }
            
            // 验证密码
            if (password === AppState.password) {
                AppState.isAuthenticated = true;
                elements.authModal.classList.remove('active');
                elements.mainContent.style.display = 'flex';
                elements.logoutBtn.style.display = 'block';
                elements.passwordInput.value = '';
            } else {
                alert('密码错误，请重新输入');
                elements.authPassword.value = '';
                elements.authPassword.focus();
            }
        }
        
        function handleLogin() {
            const password = elements.passwordInput.value.trim();
            if (!password) {
                alert('请输入访问密码');
                return;
            }
            
            if (password === AppState.password) {
                AppState.isAuthenticated = true;
                elements.mainContent.style.display = 'flex';
                elements.logoutBtn.style.display = 'block';
                elements.loginBtn.style.display = 'none';
                elements.passwordInput.style.display = 'none';
                elements.passwordInput.value = '';
            } else {
                alert('密码错误');
                elements.passwordInput.value = '';
                elements.passwordInput.focus();
            }
        }
        
        function handleLogout() {
            AppState.isAuthenticated = false;
            elements.mainContent.style.display = 'none';
            elements.logoutBtn.style.display = 'none';
            elements.loginBtn.style.display = 'block';
            elements.passwordInput.style.display = 'block';
            elements.authModal.classList.add('active');
        }
        
        // 分类管理
        function openCategoryModal(categoryId = null) {
            elements.categoryModal.classList.add('active');
            
            if (categoryId) {
                // 编辑现有分类
                AppState.editingCategoryId = categoryId;
                const category = AppState.categories.find(c => c.id === categoryId);
                if (category) {
                    elements.categoryModalTitle.textContent = '编辑分类';
                    elements.categoryName.value = category.name;
                    elements.categoryColor.value = category.color;
                    elements.deleteCategoryBtn.style.display = 'block';
                }
            } else {
                // 添加新分类
                AppState.editingCategoryId = null;
                elements.categoryModalTitle.textContent = '添加分类';
                elements.categoryName.value = '';
                elements.categoryColor.value = '#4361ee';
                elements.deleteCategoryBtn.style.display = 'none';
            }
            
            elements.categoryName.focus();
        }
        
        function closeCategoryModal() {
            elements.categoryModal.classList.remove('active');
            AppState.editingCategoryId = null;
        }
        
        function saveCategory() {
            const name = elements.categoryName.value.trim();
            const color = elements.categoryColor.value;
            
            if (!name) {
                alert('请输入分类名称');
                return;
            }
            
            if (AppState.editingCategoryId) {
                // 更新现有分类
                const index = AppState.categories.findIndex(c => c.id === AppState.editingCategoryId);
                if (index !== -1) {
                    AppState.categories[index].name = name;
                    AppState.categories[index].color = color;
                }
            } else {
                // 添加新分类
                const newCategory = {
                    id: 'category_' + Date.now(),
                    name,
                    color,
                    count: 0
                };
                AppState.categories.push(newCategory);
            }
            
            updateCategoriesUI();
            closeCategoryModal();
            saveData();
        }
        
        function deleteCategory() {
            if (!AppState.editingCategoryId) return;
            
            if (AppState.editingCategoryId === 'default') {
                alert('不能删除默认分类');
                return;
            }
            
            if (confirm('确定要删除这个分类吗？分类中的备忘录将移动到默认分类。')) {
                // 将属于该分类的备忘录移动到默认分类
                AppState.memos.forEach(memo => {
                    if (memo.categoryId === AppState.editingCategoryId) {
                        memo.categoryId = 'default';
                    }
                });
                
                // 删除分类
                AppState.categories = AppState.categories.filter(c => c.id !== AppState.editingCategoryId);
                
                updateCategoriesUI();
                updateMemosUI();
                closeCategoryModal();
                saveData();
            }
        }
        
        // 备忘录管理
        function openMemoForm(memoId = null) {
            elements.memoForm.style.display = 'block';
            elements.emptyState.style.display = 'none';
            elements.memoList.style.display = 'none';
            elements.addMemoBtn.style.display = 'none';
            
            // 更新分类选择器
            updateCategorySelectors();
            
            if (memoId) {
                // 编辑现有备忘录
                AppState.editingMemoId = memoId;
                elements.formTitle.textContent = '编辑备忘录';
                const memo = AppState.memos.find(m => m.id === memoId);
                if (memo) {
                    elements.memoTitle.value = memo.title || '';
                    elements.memoContent.value = memo.content || '';
                    elements.memoCategory.value = memo.categoryId || 'default';
                    
                    // 显示图片预览
                    if (memo.image) {
                        elements.imagePreviewContainer.style.display = 'block';
                        elements.imagePreview.innerHTML = `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <img src="${memo.image}" alt="预览" style="max-width: 100px; border-radius: 8px;">
                                <button class="btn btn-danger" onclick="removeImagePreview()" style="padding: 5px 10px; font-size: 12px;">
                                    <i class="fas fa-times"></i> 移除图片
                                </button>
                            </div>
                        `;
                    } else {
                        elements.imagePreviewContainer.style.display = 'none';
                    }
                }
            } else {
                // 添加新备忘录
                AppState.editingMemoId = null;
                elements.formTitle.textContent = '添加备忘录';
                elements.memoTitle.value = '';
                elements.memoContent.value = '';
                elements.memoCategory.value = AppState.currentCategory === 'all' ? 'default' : AppState.currentCategory;
                elements.imagePreviewContainer.style.display = 'none';
                elements.memoImage.value = '';
            }
            
            elements.memoTitle.focus();
        }
        
        function closeMemoForm() {
            elements.memoForm.style.display = 'none';
            elements.emptyState.style.display = AppState.memos.length === 0 ? 'block' : 'none';
            elements.memoList.style.display = 'grid';
            elements.addMemoBtn.style.display = 'block';
            AppState.editingMemoId = null;
        }
        
        function handleImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件');
                elements.memoImage.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                elements.imagePreviewContainer.style.display = 'block';
                elements.imagePreview.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${e.target.result}" alt="预览" style="max-width: 100px; border-radius: 8px;">
                        <button class="btn btn-danger" onclick="removeImagePreview()" style="padding: 5px 10px; font-size: 12px;">
                            <i class="fas fa-times"></i> 移除图片
                        </button>
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        }
        
        function removeImagePreview() {
            elements.imagePreviewContainer.style.display = 'none';
            elements.imagePreview.innerHTML = '';
            elements.memoImage.value = '';
        }
        
        function saveMemo() {
            const title = elements.memoTitle.value.trim();
            const content = elements.memoContent.value.trim();
            const categoryId = elements.memoCategory.value;
            
            if (!title && !content) {
                alert('标题和内容不能同时为空');
                return;
            }
            
            // 获取图片数据
            let imageData = null;
            if (elements.memoImage.files && elements.memoImage.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imageData = e.target.result;
                    completeSaveMemo(title, content, categoryId, imageData);
                };
                reader.readAsDataURL(elements.memoImage.files[0]);
            } else {
                // 如果是编辑模式，保留原有图片
                if (AppState.editingMemoId) {
                    const existingMemo = AppState.memos.find(m => m.id === AppState.editingMemoId);
                    if (existingMemo && existingMemo.image) {
                        imageData = existingMemo.image;
                    }
                }
                completeSaveMemo(title, content, categoryId, imageData);
            }
        }
        
        function completeSaveMemo(title, content, categoryId, imageData) {
            if (AppState.editingMemoId) {
                // 更新现有备忘录
                const index = AppState.memos.findIndex(m => m.id === AppState.editingMemoId);
                if (index !== -1) {
                    AppState.memos[index].title = title;
                    AppState.memos[index].content = content;
                    AppState.memos[index].categoryId = categoryId;
                    AppState.memos[index].image = imageData;
                    AppState.memos[index].updatedAt = new Date().toISOString();
                }
            } else {
                // 添加新备忘录
                const newMemo = {
                    id: 'memo_' + Date.now(),
                    title,
                    content,
                    categoryId,
                    image: imageData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                AppState.memos.push(newMemo);
            }
            
            updateMemosUI();
            closeMemoForm();
            saveData();
        }
        
        function deleteMemo(memoId) {
            if (confirm('确定要删除这个备忘录吗？')) {
                AppState.memos = AppState.memos.filter(m => m.id !== memoId);
                updateMemosUI();
                saveData();
            }
        }
        
        function editMemo(memoId) {
            openMemoForm(memoId);
        }
        
        function viewImage(imageSrc) {
            elements.modalImage.src = imageSrc;
            elements.imageModal.classList.add('active');
        }
        
        function closeImageModal() {
            elements.imageModal.classList.remove('active');
        }
        
        function downloadImage() {
            const imageSrc = elements.modalImage.src;
            const link = document.createElement('a');
            link.href = imageSrc;
            link.download = 'memo_image_' + Date.now() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // 更新UI
        function updateCategoriesUI() {
            // 更新分类列表
            elements.categoriesList.innerHTML = '';
            
            // 计算每个分类的备忘录数量
            AppState.categories.forEach(category => {
                category.count = AppState.memos.filter(memo => memo.categoryId === category.id).length;
            });
            
            AppState.categories.forEach(category => {
                const isActive = AppState.currentCategory === category.id;
                
                const categoryItem = document.createElement('li');
                categoryItem.className = `category-item ${isActive ? 'active' : ''}`;
                categoryItem.style.borderLeftColor = category.color;
                categoryItem.innerHTML = `
                    <span class="category-name">${category.name}</span>
                    <span class="category-count">${category.count}</span>
                    <div class="category-actions">
                        <button class="category-action-btn" onclick="openCategoryModal('${category.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                `;
                
                categoryItem.addEventListener('click', (e) => {
                    if (!e.target.closest('.category-actions')) {
                        AppState.currentCategory = category.id;
                        updateCategoriesUI();
                        updateMemosUI();
                    }
                });
                
                elements.categoriesList.appendChild(categoryItem);
            });
            
            // 更新分类筛选器
            updateCategorySelectors();
            
            // 更新当前分类显示
            if (AppState.currentCategory === 'all') {
                elements.currentCategory.textContent = '(所有分类)';
            } else {
                const category = AppState.categories.find(c => c.id === AppState.currentCategory);
                elements.currentCategory.textContent = category ? `(${category.name})` : '(所有分类)';
            }
        }
        
        function updateCategorySelectors() {
            // 更新备忘录表单中的分类选择器
            elements.memoCategory.innerHTML = '';
            AppState.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                elements.memoCategory.appendChild(option);
            });
            
            // 更新分类筛选器
            elements.categoryFilter.innerHTML = '<option value="all">所有分类</option>';
            AppState.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                if (AppState.currentCategory === category.id) {
                    option.selected = true;
                }
                elements.categoryFilter.appendChild(option);
            });
            
            // 添加"所有分类"选项
            if (AppState.currentCategory === 'all') {
                elements.categoryFilter.querySelector('option[value="all"]').selected = true;
            }
        }
        
        function updateMemosUI() {
            // 过滤备忘录
            let filteredMemos = AppState.memos;
            if (AppState.currentCategory !== 'all') {
                filteredMemos = AppState.memos.filter(memo => memo.categoryId === AppState.currentCategory);
            }
            
            // 按更新时间排序（最新的在前面）
            filteredMemos.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            
            // 更新备忘录列表
            elements.memoList.innerHTML = '';
            
            if (filteredMemos.length === 0) {
                elements.emptyState.style.display = 'block';
                elements.memoList.style.display = 'none';
            } else {
                elements.emptyState.style.display = 'none';
                elements.memoList.style.display = 'grid';
                
                filteredMemos.forEach(memo => {
                    const category = AppState.categories.find(c => c.id === memo.categoryId) || AppState.categories[0];
                    const date = new Date(memo.updatedAt).toLocaleString('zh-CN');
                    
                    const memoItem = document.createElement('div');
                    memoItem.className = 'memo-item';
                    memoItem.innerHTML = `
                        <div class="memo-header">
                            <div>
                                <h4 style="margin-bottom: 5px;">${memo.title || '无标题'}</h4>
                                <div class="memo-date">${date}</div>
                            </div>
                            <div class="memo-actions">
                                <button class="category-action-btn" onclick="editMemo('${memo.id}')" title="编辑">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="category-action-btn" onclick="deleteMemo('${memo.id}')" title="删除" style="color: var(--danger-color);">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="memo-text">${memo.content || ''}</div>
                        ${memo.image ? `
                            <div class="memo-image-container">
                                <img src="${memo.image}" alt="备忘录图片" class="memo-image" onclick="viewImage('${memo.image}')">
                            </div>
                        ` : ''}
                        <div class="memo-category" style="background-color: ${category.color}20; color: ${category.color};">
                            ${category.name}
                        </div>
                    `;
                    
                    elements.memoList.appendChild(memoItem);
                });
            }
        }
        
        // 数据存储和加载
        function saveData() {
            const data = {
                memos: AppState.memos,
                categories: AppState.categories,
                password: AppState.password
            };
            
            // 保存到本地存储
            localStorage.setItem('sharedMemoData', JSON.stringify(data));
            
            // 这里可以添加Cloudflare Workers API调用
            // 在实际部署中，您需要将数据发送到Cloudflare Workers
            console.log('数据已保存，准备同步到云端...');
            
            // 模拟云端同步
            if (typeof saveToCloud === 'function') {
                saveToCloud(data);
            }
        }
        
        function loadData() {
            // 从本地存储加载数据
            const savedData = localStorage.getItem('sharedMemoData');
            
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    AppState.memos = data.memos || [];
                    AppState.categories = data.categories || [{ id: 'default', name: '默认', color: '#4361ee', count: 0 }];
                    
                    // 确保有默认分类
                    if (!AppState.categories.find(c => c.id === 'default')) {
                        AppState.categories.unshift({ id: 'default', name: '默认', color: '#4361ee', count: 0 });
                    }
                } catch (e) {
                    console.error('加载数据失败:', e);
                }
            }
            
            // 这里可以添加从Cloudflare Workers加载数据的逻辑
            console.log('数据已从本地加载');
            
            // 模拟从云端加载
            if (typeof loadFromCloud === 'function') {
                loadFromCloud();
            }
        }
        
        // Cloudflare Workers 集成函数
        // 这些函数需要在部署到Cloudflare Workers时实现
        async function saveToCloud(data) {
            // 在实际部署中，这里应该调用Cloudflare Workers API
            // 示例代码：
            try {
                const response = await fetch('https://note.wuzhijj.workers.dev/api/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${AppState.password}`
                    },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    console.log('数据已同步到云端');
                }
            } catch (error) {
                console.error('同步到云端失败:', error);
            }
        }
        
        async function loadFromCloud() {
            // 在实际部署中，这里应该调用Cloudflare Workers API
            // 示例代码：
            try {
                const response = await fetch('https://note.wuzhijj.workers.dev/api/load', {
                    headers: {
                        'Authorization': `Bearer ${AppState.password}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    AppState.memos = data.memos || [];
                    AppState.categories = data.categories || [{ id: 'default', name: '默认', color: '#4361ee', count: 0 }];
                    updateCategoriesUI();
                    updateMemosUI();
                    console.log('数据已从云端加载');
                }
            } catch (error) {
                console.error('从云端加载数据失败:', error);
            }
        }
        
        // 初始化应用
        document.addEventListener('DOMContentLoaded', initApp);
    </script>
</body>
</html>`;