/**
 * 图片画廊客户端脚本
 * 处理瀑布流布局、无限滚动、图片加载等功能
 */

/**
 * 画廊管理类
 */
export class GalleryManager {
  constructor(galleryElement, options = {}) {
    this.gallery = galleryElement;
    this.options = {
      pageSize: 30,
      apiEndpoint: '/api/images',
      onImageClick: null,
      onError: null,
      ...options
    };

    // 状态管理
    this.state = {
      currentPage: 1,
      isLoading: false,
      hasMore: true,
      currentCategory: null,
      isPreloading: false
    };

    // 瀑布流配置
    this.masonry = {
      columnCount: 0,
      columnWidth: 0,
      columnGap: 20,
      columnHeights: [],
      cardPositions: new Map()
    };

    this.init();
  }

  /**
   * 初始化画廊
   */
  init() {
    this.initMasonry();
    this.attachEventListeners();
    console.log('[Gallery] Initialized');
  }

  /**
   * 初始化瀑布流布局
   */
  initMasonry() {
    const config = this.getMasonryConfig();
    this.masonry.columnCount = config.columns;
    this.masonry.columnWidth = config.columnWidth;
    this.masonry.columnGap = config.gap;
    this.masonry.columnHeights = new Array(config.columns).fill(0);
    
    console.log('[Masonry] Config:', config);
  }

  /**
   * 获取瀑布流配置
   */
  getMasonryConfig() {
    if (!this.gallery) {
      return { columns: 4, columnWidth: 280, gap: 20, pageSize: 30 };
    }

    const containerWidth = this.gallery.offsetWidth || this.gallery.clientWidth;
    const screenWidth = window.innerWidth;

    let columns, minColumnWidth, gap, pageSize;

    // 响应式列数配置
    if (screenWidth < 768) {
      columns = 1;
      minColumnWidth = 280;
      gap = 15;
      pageSize = 10;
    } else if (screenWidth < 1024) {
      columns = 3;
      minColumnWidth = 200;
      gap = 18;
      pageSize = 20;
    } else if (screenWidth < 1400) {
      columns = 4;
      minColumnWidth = 250;
      gap = 20;
      pageSize = 30;
    } else {
      columns = 5;
      minColumnWidth = 280;
      gap = 25;
      pageSize = 30;
    }

    // 根据容器宽度计算实际列宽
    const totalGapWidth = (columns - 1) * gap;
    const availableWidth = containerWidth - totalGapWidth;
    const calculatedColumnWidth = Math.floor(availableWidth / columns);

    // 如果列宽小于最小值，减少列数
    if (calculatedColumnWidth < minColumnWidth && columns > 1) {
      columns = columns - 1;
      const newTotalGapWidth = (columns - 1) * gap;
      const newAvailableWidth = containerWidth - newTotalGapWidth;
      const finalColumnWidth = Math.floor(newAvailableWidth / columns);
      return { columns, columnWidth: finalColumnWidth, gap, pageSize };
    }

    return { columns, columnWidth: calculatedColumnWidth, gap, pageSize };
  }

  /**
   * 获取最短的列索引
   */
  getShortestColumn() {
    let minHeight = this.masonry.columnHeights[0];
    let minIndex = 0;
    
    for (let i = 1; i < this.masonry.columnHeights.length; i++) {
      if (this.masonry.columnHeights[i] < minHeight) {
        minHeight = this.masonry.columnHeights[i];
        minIndex = i;
      }
    }
    
    return minIndex;
  }

  /**
   * 更新画廊高度
   */
  updateGalleryHeight() {
    if (this.gallery) {
      const maxHeight = Math.max(...this.masonry.columnHeights);
      this.gallery.style.height = maxHeight + 'px';
    }
  }

  /**
   * 加载图片
   */
  async loadImages(category = null, reset = false) {
    if (this.state.isLoading || (!this.state.hasMore && !reset)) {
      if (!this.state.hasMore && !reset) {
        this.showAllLoadedIndicator();
      }
      return;
    }

    try {
      this.state.isLoading = true;
      this.showLoadingIndicator();
      this.hideAllLoadedIndicator();

      // 重置状态
      if (reset || category !== this.state.currentCategory) {
        this.state.currentPage = 1;
        this.state.hasMore = true;
        this.state.currentCategory = category;
        
        if (this.gallery) {
          this.gallery.innerHTML = '';
          this.gallery.style.height = '0px';
        }
        
        this.initMasonry();
      }

      const config = this.getMasonryConfig();
      const pageSize = config.pageSize;
      
      // 构建API URL
      let url = `${this.options.apiEndpoint}?page=${this.state.currentPage}&limit=${pageSize}`;
      if (category) {
        url += '&category=' + encodeURIComponent(category);
      }

      console.log(`[Gallery] Loading page ${this.state.currentPage}:`, url);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      console.log('[Gallery] Received:', data.images?.length || 0, 'images');

      // 处理空结果
      if (this.state.currentPage === 1 && (!data.images || data.images.length === 0)) {
        this.showEmptyState();
        this.state.hasMore = false;
        this.hideLoadingIndicator();
        return;
      }

      // 渲染图片
      await this.renderImages(data.images);

      // 更新状态
      this.state.hasMore = data.hasMore || false;
      this.state.currentPage++;

      // 显示完成提示
      if (!this.state.hasMore) {
        setTimeout(() => this.showAllLoadedIndicator(), 500);
      }

      console.log(`[Gallery] Loaded. HasMore: ${this.state.hasMore}, NextPage: ${this.state.currentPage}`);

    } catch (error) {
      console.error('[Gallery] Load error:', error);
      if (this.options.onError) {
        this.options.onError(error);
      }
      
      if (this.state.currentPage === 1 && this.gallery) {
        this.gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px;">加载图片失败，请刷新页面重试。</div>';
      }
    } finally {
      this.state.isLoading = false;
      this.hideLoadingIndicator();
    }
  }

  /**
   * 渲染图片列表
   */
  async renderImages(images) {
    if (!this.gallery || !images || images.length === 0) return;

    const newCards = [];
    const imageLoadPromises = [];

    // 创建图片卡片
    images.forEach((image, index) => {
      try {
        const card = this.createImageCard(image);
        card.classList.add('card-new');
        card.style.visibility = 'hidden';
        this.gallery.appendChild(card);
        newCards.push(card);

        // 等待图片加载
        const img = card.querySelector('img');
        if (img) {
          const promise = new Promise((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
              setTimeout(resolve, 3000); // 超时保护
            }
          });
          imageLoadPromises.push(promise);
        }
      } catch (err) {
        console.error(`[Gallery] Failed to create card ${index}:`, err);
      }
    });

    // 等待所有图片加载
    await Promise.all(imageLoadPromises);
    console.log('[Gallery] All images loaded, layouting...');

    // 布局卡片
    requestAnimationFrame(() => {
      newCards.forEach((card, index) => {
        card.style.visibility = 'visible';

        const columnIndex = this.getShortestColumn();
        const left = columnIndex * (this.masonry.columnWidth + this.masonry.columnGap);
        const top = this.masonry.columnHeights[columnIndex];

        card.style.left = left + 'px';
        card.style.top = top + 'px';
        card.style.width = this.masonry.columnWidth + 'px';

        this.masonry.cardPositions.set(card, { columnIndex, top });

        const actualHeight = card.offsetHeight;
        this.masonry.columnHeights[columnIndex] = top + actualHeight + this.masonry.columnGap;

        // 淡入动画
        setTimeout(() => {
          card.classList.add('card-visible');
          card.classList.remove('card-new');
        }, index * 30);
      });

      this.updateGalleryHeight();
    });
  }

  /**
   * 创建图片卡片（使用组件）
   */
  createImageCard(image) {
    const card = document.createElement('div');
    card.className = 'image-card';
    card.setAttribute('data-image-id', image.id);

    // 图片链接
    const link = document.createElement('a');
    link.href = '/image/' + (image.slug || image.id);

    const img = document.createElement('img');
    img.src = image.image_url;
    img.alt = image.description || 'Image';
    img.loading = 'lazy';
    img.decoding = 'async';
    
    if (image.width && image.height) {
      img.style.aspectRatio = `${image.width} / ${image.height}`;
    }

    img.onerror = () => {
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="250"%3E%3Crect fill="%23ddd" width="300" height="250"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
    };

    link.appendChild(img);

    // 内容区域
    const content = document.createElement('div');
    content.className = 'image-card-content';

    // 点赞按钮
    const likeButton = document.createElement('div');
    likeButton.className = 'like-button';
    likeButton.innerHTML = '❤️';
    likeButton.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleLike(image.id, likeButton);
    };

    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = image.likes_count || 0;
    likeButton.appendChild(likeCount);

    // 描述
    const desc = document.createElement('p');
    desc.className = 'image-description';
    desc.textContent = image.description || '';
    desc.style.cursor = 'pointer';
    desc.onclick = (e) => {
      e.preventDefault();
      window.location.href = '/image/' + (image.slug || image.id);
    };

    content.appendChild(likeButton);
    content.appendChild(desc);

    // 标签
    if (image.tags && image.tags.length > 0) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'tags';

      const categoryTag = image.tags.find(t => t.level === 1);
      const otherTag = image.tags.find(t => t.level > 1);

      [categoryTag, otherTag].filter(Boolean).forEach(tag => {
        const tagLink = document.createElement('a');
        tagLink.href = (tag.level === 1 ? '/category/' : '/tag/') + encodeURIComponent(tag.name);
        tagLink.className = 'tag level-' + tag.level;
        tagLink.textContent = tag.name;
        tagLink.onclick = (e) => e.stopPropagation();
        tagsDiv.appendChild(tagLink);
      });

      content.appendChild(tagsDiv);
    }

    card.appendChild(link);
    card.appendChild(content);
    return card;
  }

  /**
   * 点赞功能
   */
  async toggleLike(imageId, button) {
    try {
      const isLiked = button.classList.contains('liked');
      const endpoint = isLiked ? '/api/unlike' : '/api/like';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId })
      });

      const data = await response.json();

      if (data.success || data.liked !== undefined) {
        button.classList.toggle('liked', data.liked);
        const countEl = button.querySelector('.like-count');
        if (countEl) {
          countEl.textContent = data.likesCount || 0;
        }
      }
    } catch (error) {
      console.error('[Gallery] Like error:', error);
    }
  }

  /**
   * 显示/隐藏加载指示器
   */
  showLoadingIndicator() {
    const indicator = document.getElementById('infiniteLoading');
    if (indicator) indicator.style.display = 'block';
  }

  hideLoadingIndicator() {
    const indicator = document.getElementById('infiniteLoading');
    if (indicator) indicator.style.display = 'none';
  }

  showAllLoadedIndicator() {
    const indicator = document.getElementById('allLoaded');
    if (indicator) indicator.style.display = 'block';
  }

  hideAllLoadedIndicator() {
    const indicator = document.getElementById('allLoaded');
    if (indicator) indicator.style.display = 'none';
  }

  /**
   * 显示空状态
   */
  showEmptyState() {
    if (this.gallery) {
      this.gallery.innerHTML = '<div style="color: white; text-align: center; padding: 40px; position: relative;">暂无图片。</div>';
    }
    this.hideLoadingIndicator();
    this.showAllLoadedIndicator();
  }

  /**
   * 附加事件监听器
   */
  attachEventListeners() {
    // 无限滚动
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        if (this.state.isLoading || !this.state.hasMore) return;

        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // 距离底部800px时触发加载
        if (scrollTop + windowHeight >= documentHeight - 800) {
          console.log('[Scroll] Near bottom, loading more...');
          this.loadImages(this.state.currentCategory);
        }
      }, 100);
    });

    // 窗口大小改变时重新布局
    let resizeTimeout;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      
      resizeTimeout = setTimeout(() => {
        console.log('[Resize] Window resized, relaying out...');
        const oldConfig = {
          columns: this.masonry.columnCount,
          columnWidth: this.masonry.columnWidth,
          gap: this.masonry.columnGap
        };
        const newConfig = this.getMasonryConfig();

        // 只有在配置变化时才重新布局
        if (oldConfig.columns !== newConfig.columns || 
            oldConfig.columnWidth !== newConfig.columnWidth) {
          this.relayout();
        }
      }, 500);
    });
  }

  /**
   * 重新布局所有卡片
   */
  relayout() {
    this.initMasonry();
    const allCards = Array.from(this.gallery.querySelectorAll('.image-card'));

    allCards.forEach(card => {
      const columnIndex = this.getShortestColumn();
      const left = columnIndex * (this.masonry.columnWidth + this.masonry.columnGap);
      const top = this.masonry.columnHeights[columnIndex];

      card.style.left = left + 'px';
      card.style.top = top + 'px';
      card.style.width = this.masonry.columnWidth + 'px';

      this.masonry.cardPositions.set(card, { columnIndex, top });

      const actualHeight = card.offsetHeight;
      this.masonry.columnHeights[columnIndex] = top + actualHeight + this.masonry.columnGap;
    });

    this.updateGalleryHeight();
  }

  /**
   * 重置画廊
   */
  reset() {
    this.state.currentPage = 1;
    this.state.hasMore = true;
    this.state.currentCategory = null;
    
    if (this.gallery) {
      this.gallery.innerHTML = '';
      this.gallery.style.height = '0px';
    }
    
    this.initMasonry();
  }

  /**
   * 销毁画廊
   */
  destroy() {
    // 清理事件监听器
    // 这里可以保存监听器的引用并在销毁时移除
    console.log('[Gallery] Destroyed');
  }
}

