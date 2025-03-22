"use strict";
window.theme = window.theme || {};
const options = {
  templateProduct: ".tps__template-product",
  flashSold: ".tps__flash-sold",
  countdownTimer: ".tps__countdown-timer",
  visitors: ".tps__visitors",
  countdowProduct: ".tps__countdow-product",
  paymentButton: ".tps__payment-button",
  navTabs: ".nav-tabs a",
  accorditionTabs: ".data.accordition",
  productInfomationTab: ".tps__product-tabs-content",
  tabContent: ".tab-content .tab-item",
  productAddons: ".tps__product_addons",
  shareCopy: ".tps__share-copy",
  compareColorsBtn: ".tps__compare-color-btn",
  photoZoomImage: ".tps__zoom-image",
  mediaImage: ".tps__media-image",
};
theme.ProductVideo = (function () {
  var videos = {};

  var mainProduct = {
    product: "product",
    productGrid1: "product-grid-1",
    productGrid2: "product-grid-2",
  };
  var hosts = {
    shopify: "shopify",
    external: "external",
  };

  var selectors = {
    productMediaWrapper: "[data-product-single-media-wrapper]",
  };

  var attributes = {
    enableVideoLooping: "enable-video-looping",
    videoId: "video-id",
  };

  function init(videoContainer, sectionId) {
    if (!videoContainer) {
      return;
    }

    var videoElement = videoContainer.querySelector("iframe, video");

    if (!videoElement) {
      return;
    }

    var mediaId = videoContainer.getAttribute("data-product-media-id");
    videos[mediaId] = {
      mediaId: mediaId,
      sectionId: sectionId,
      host: hostFromVideoElement(videoElement),
      container: videoContainer,
      element: videoElement,
      ready: function () {
        createPlayer(this);
      },
    };

    window.Shopify.loadFeatures([
      {
        name: "video-ui",
        version: "2.0",
        onLoad: setupVideos,
      },
    ]);
    theme.LibraryLoader.load("plyrShopifyStyles");
  }

  function setupVideos(errors) {
    if (errors) {
      fallbackToNativeVideo();
      return;
    }

    loadVideos();
  }

  function createPlayer(video) {
    if (video.player) {
      return;
    }

    var productMediaWrapper = video.container.closest(
      selectors.productMediaWrapper
    );

    var enableLooping =
      productMediaWrapper.getAttribute(
        "data-" + attributes.enableVideoLooping
      ) === "true";

    // eslint-disable-next-line no-undef
    video.player = new Shopify.Video(video.element, {
      loop: { active: enableLooping },
    });

    var pauseVideo = function () {
      if (!video.player) return;
      video.player.pause();
    };

    productMediaWrapper.addEventListener("mediaHidden", pauseVideo);
    productMediaWrapper.addEventListener("xrLaunch", pauseVideo);

    productMediaWrapper.addEventListener("mediaVisible", function () {
      if (theme.Helpers.isTouch()) return;
      if (!video.player) return;
      video.player.play();
    });
  }

  function hostFromVideoElement(video) {
    if (video.tagName === "VIDEO") {
      return hosts.shopify;
    }

    return hosts.external;
  }

  function loadVideos() {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];
        video.ready();
      }
    }
  }

  function fallbackToNativeVideo() {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];

        if (video.nativeVideo) continue;

        if (video.host === hosts.shopify) {
          video.element.setAttribute("controls", "controls");
          video.nativeVideo = true;
        }
      }
    }
  }

  function removeSectionVideos(sectionId) {
    for (var key in videos) {
      if (videos.hasOwnProperty(key)) {
        var video = videos[key];

        if (video.sectionId === sectionId) {
          if (video.player) video.player.destroy();
          delete videos[key];
        }
      }
    }
  }

  return {
    init: init,
    hosts: hosts,
    loadVideos: loadVideos,
    removeSectionVideos: removeSectionVideos,
  };
})();

theme.ProductModel = (function () {
  var modelJsonSections = {};
  var models = {};
  var xrButtons = {};

  var selectors = {
    mediaGroup: "[data-product-single-media-group]",
    xrButton: "[data-shopify-xr]",
  };

  function init(modelViewerContainers, sectionId) {
    modelJsonSections[sectionId] = {
      loaded: false,
    };

    modelViewerContainers.forEach(function (modelViewerContainer, index) {
      var mediaId = modelViewerContainer.getAttribute("data-product-media-id");
      var modelViewerElement =
        modelViewerContainer.querySelector("model-viewer");
      var modelId = modelViewerElement.getAttribute("data-model-id");

      if (index === 0) {
        var mediaGroup = modelViewerContainer.closest(selectors.mediaGroup);
        var xrButton = mediaGroup.querySelector(selectors.xrButton);
        xrButtons[sectionId] = {
          element: xrButton,
          defaultId: modelId,
        };
      }

      models[mediaId] = {
        modelId: modelId,
        sectionId: sectionId,
        container: modelViewerContainer,
        element: modelViewerElement,
      };
    });

    window.Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: setupShopifyXr,
      },
      {
        name: "model-viewer-ui",
        version: "1.0",
        onLoad: setupModelViewerUi,
      },
    ]);
    theme.LibraryLoader.load("modelViewerUiStyles");
  }

  function setupShopifyXr(errors) {
    if (errors) return;

    if (!window.ShopifyXR) {
      document.addEventListener("shopify_xr_initialized", function () {
        setupShopifyXr();
      });
      return;
    }

    for (var sectionId in modelJsonSections) {
      if (modelJsonSections.hasOwnProperty(sectionId)) {
        var modelSection = modelJsonSections[sectionId];

        if (modelSection.loaded) continue;
        var modelJson = document.querySelector("#ModelJson-" + sectionId);

        window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
        modelSection.loaded = true;
      }
    }
    window.ShopifyXR.setupXRElements();
  }

  function setupModelViewerUi(errors) {
    if (errors) return;

    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (!model.modelViewerUi) {
          model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
        }
        setupModelViewerListeners(model);
      }
    }
  }

  function setupModelViewerListeners(model) {
    var xrButton = xrButtons[model.sectionId];

    model.container.addEventListener("mediaVisible", function () {
      xrButton.element.setAttribute("data-shopify-model3d-id", model.modelId);
      if (theme.Helpers.isTouch()) return;
      model.modelViewerUi.play();
    });

    model.container.addEventListener("mediaHidden", function () {
      xrButton.element.setAttribute(
        "data-shopify-model3d-id",
        xrButton.defaultId
      );
      model.modelViewerUi.pause();
    });

    model.container.addEventListener("xrLaunch", function () {
      model.modelViewerUi.pause();
    });
  }

  function removeSectionModels(sectionId) {
    for (var key in models) {
      if (models.hasOwnProperty(key)) {
        var model = models[key];
        if (model.sectionId === sectionId) {
          models[key].modelViewerUi.destroy();
          delete models[key];
        }
      }
    }
    delete modelJsonSections[sectionId];
  }

  return {
    init: init,
    removeSectionModels: removeSectionModels,
  };
})();

theme.LibraryLoader = (function () {
  var types = {
    link: "link",
    script: "script",
  };

  var status = {
    requested: "requested",
    loaded: "loaded",
  };

  var cloudCdn = "https://cdn.shopify.com/shopifycloud/";

  var libraries = {
    plyrShopifyStyles: {
      tagId: "plyr-shopify-styles",
      src: cloudCdn + "plyr/v2.0/shopify-plyr.css",
      type: types.link,
    },
    modelViewerUiStyles: {
      tagId: "shopify-model-viewer-ui-styles",
      src: cloudCdn + "model-viewer-ui/assets/v1.0/model-viewer-ui.css",
      type: types.link,
    },
  };

  function load(libraryName, callback) {
    var library = libraries[libraryName];

    if (!library) return;
    if (library.status === status.requested) return;

    callback = callback || function () {};
    if (library.status === status.loaded) {
      callback();
      return;
    }

    library.status = status.requested;

    var tag;

    switch (library.type) {
      case types.script:
        tag = createScriptTag(library, callback);
        break;
      case types.link:
        tag = createLinkTag(library, callback);
        break;
    }

    tag.id = library.tagId;
    library.element = tag;

    var firstScriptTag = document.getElementsByTagName(library.type)[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  function createScriptTag(library, callback) {
    var tag = document.createElement("script");
    tag.src = library.src;
    tag.addEventListener("load", function () {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  function createLinkTag(library, callback) {
    var tag = document.createElement("link");
    tag.href = library.src;
    tag.rel = "stylesheet";
    tag.type = "text/css";
    tag.addEventListener("load", function () {
      library.status = status.loaded;
      callback();
    });
    return tag;
  }

  return {
    load: load,
  };
})();

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll(".tps__option-swatch").forEach((button) =>
      button.addEventListener("click", this.onVariantChange.bind(this), false)
    );
  }

  onVariantChange(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const value = target.getAttribute("data-value");
    for (var item of target
      .closest("fieldset")
      .querySelectorAll(".tps__option-swatch")) {
      item.classList.remove("active");
    }
    target.classList.toggle("active");
    target
      .closest("fieldset")
      .querySelector(".swatch-selected-value").textContent = value;
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.updatePickupAvailability();
    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      // this.removeErrorMessage();
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll(".tps__option-swatch.active"),
      (select) => select.getAttribute("data-value")
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    if (!this.currentVariant) return;
    if (!this.currentVariant.featured_media) return;
    const productMedia = document.querySelectorAll(
      "#productDetailsNavThumb button"
    );
    if (!productMedia) return;
    const featuredMediaId = this.currentVariant.featured_image.id;
    var productMediaNav = document.querySelectorAll(
      ".tp-product-details-variation button"
    );
    // Iterate over each button and log its ID
    productMedia.forEach(function (button) {
      var buttonId = button.getAttribute("data-image-id");
      if (buttonId == featuredMediaId) {
        button.click();
      }
    });
  }

  updateURL() {
    if (!this.currentVariant || this.dataset.updateUrl === "false") return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    if (document.querySelector(".sticky-addcart-opstion")) {
      document.querySelector(".sticky-addcart-opstion").value =
        this.currentVariant.id;
    }
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  removeErrorMessage() {
    const section = this.closest("section");
    if (!section) return;

    const productForm = section.querySelector("product-form");
    if (productForm) productForm.handleErrorMessage();
  }

  renderProductInfo() {
    if (!this.currentVariant) return;
    let qty = 0;
    let percent = 0;
    let sale = false;
    let soldOut = false;
    let variantStrings =
      window.variantStrings && window.variantStrings.soldOut
        ? window.variantStrings.soldOut
        : "";
    let availability =
      window.variantStrings && window.variantStrings.inStock
        ? window.variantStrings.inStock
        : "";
    const compare_at_price = this.currentVariant.compare_at_price;
    const unit_price = this.currentVariant.unit_price;
    const unit_price_measurement = this.currentVariant.unit_price_measurement;

    const price = this.currentVariant.price;
    const form = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const product = form.closest(".tp-product-details-wrapper");
    this.getVariantQtyData().find((variantQty) => {
      if (variantQty.id === this.currentVariant.id) {
        qty = variantQty.qty;
      }
    });
    if (compare_at_price && compare_at_price > price) {
      sale = true;
      percent = ((compare_at_price - price) / compare_at_price) * 100;
    }
    const stli = document.querySelector("stock-countdown");
    if (stli) {
      const il = stli.dataset.itemsLeft;
      const ms = stli.dataset.message;
      if (il >= qty && ms && qty >= 1) {
        stli.classList.remove("d-none");
        const qt = stli.querySelector("span.tps__count");
        if (qt) {
          qt.innerHTML = qty;
        }
      } else {
        stli.classList.add("d-none");
      }
    }
    const stockNotify = document.querySelector(".product-notify-stock");
    if (stockNotify) {
      if (!this.currentVariant.available) {
        stockNotify.style.display = "block";
        stockNotify.setAttribute(
          "data-product-variant",
          this.currentVariant.id
        );
      } else {
        stockNotify.style.display = "none";
        stockNotify.setAttribute(
          "data-product-variant",
          this.currentVariant.id
        );
      }
    }
    if (unit_price && unit_price_measurement) {
      const price_num = Shopify.formatMoney(
        unit_price,
        cartStrings.money_format
      );
      const price_unit =
        unit_price_measurement.reference_value != 1
          ? unit_price_measurement.reference_value
          : unit_price_measurement.reference_unit;
      const upn = product.querySelector(".unit-price .number");
      const upu = product.querySelector(".unit-price .unit");
      if (upn) {
        upn.innerHTML = price_num;
      }
      if (upu) {
        upu.innerHTML = price_unit;
      }
    }
    if (this.currentVariant.available && qty < 1) {
      availability =
        window.variantStrings && window.variantStrings.preOrder
          ? window.variantStrings.preOrder
          : "";
      variantStrings = window.variantStrings.preOrder;
    } else if (!this.currentVariant.available) {
      availability = window.variantStrings.outStock;
      soldOut = true;
    } else {
      // availability = window.variantStrings.inStock;
      availability =
        window.variantStrings && window.variantStrings.inStock
          ? window.variantStrings.inStock
          : "";
      variantStrings =
        window.variantStrings && window.variantStrings.addToCart
          ? window.variantStrings.addToCart
          : "";
    }
    if (this.currentVariant.inventory_management === null) {
      soldOut = false;
      availability = window.variantStrings.inStock;
      variantStrings = window.variantStrings.addToCart;
    }

    const price_format = Shopify.formatMoney(
      this.currentVariant.price,
      cartStrings.money_format
    );

    // Manually prepend the currency symbol to the formatted price
    const formatted_price_with_symbol = cartStrings.money_format.replace(
      "{{amount}}",
      price_format
    );

    product.querySelector(
      ".tp-product-details-price-wrapper .new-price"
    ).innerHTML = formatted_price_with_symbol;

    const tps__price = product.querySelector(".tps__price");
    tps__price.classList.remove("price--sold-out", "price--on-sale");
    tps__price
      .querySelector(".tp-product-details-price-wrapper .new-price")
      .classList.remove("special-price");

    if (compare_at_price && compare_at_price > price) {
      const compare_format = Shopify.formatMoney(
        compare_at_price,
        cartStrings.money_format
      );

      // Manually prepend the currency symbol to the formatted compare price
      const formatted_compare_price_with_symbol =
        cartStrings.money_format.replace("{{amount}}", compare_format);
      product.querySelector(".old-price").innerHTML =
        formatted_compare_price_with_symbol;
      tps__price.classList.add("price--on-sale");
      product
        .querySelector(".tp-product-details-price-wrapper .new-price")
        .classList.add("special-price");
    } else if (!this.currentVariant.available) {
      tps__price.classList.add("price--sold-out");
    }

    this.toggleAddButton(!this.currentVariant.available, variantStrings);
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;
    if (disable) {
      addButton.setAttribute("disabled", "disabled");
    } else {
      addButton.removeAttribute("disabled");
    }
    if (text) {
      addButtonText.textContent = text;
    }
    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const addButtonText = button.querySelector('[name="add"] > span');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButtonText.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }

  getVariantQtyData() {
    this.variantQtyData = JSON.parse(
      this.querySelector(".productVariantsQty").textContent
    );
    return this.variantQtyData;
  }
}
customElements.define("variant-selects", VariantSelects);

var TpsEventMainProductShopify = (function () {
  return {
    init: function () {
      this.setupEventListeners();
      this.eventVisitors();
      this.eventCountdowProduct();
      this.eventProductTabs();
      this.eventCompareColors();
      this.stickyAddToCartButton();
      this.productMedia();
      this.eventMediaGalleryProduct();
      this.eventProductBoughTogether();
      this.eventProductGroup();
      this.showPopupStockNotify();
      this.eventSkeleton();
      this.actionDropdownSwatches();
    },

    setupEventListeners: function () {
      const input__product_detail = document.querySelector(
        ".product-detail__input"
      );
      const input__product_sticky = document.querySelector(
        ".product-sticky__input"
      );
      if (input__product_detail && input__product_sticky) {
        input__product_detail.addEventListener("change", (e) => {
          e.preventDefault();
          input__product_sticky.value = input__product_detail.value;
        });
        input__product_sticky.addEventListener("change", (e) => {
          e.preventDefault();
          input__product_detail.value = input__product_sticky.value;
        });
      }
      document.querySelectorAll(options.productAddons).forEach((addons) => {
        addons.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            const id = target.getAttribute("data-id");
            const text = target.getAttribute("data-text");
            const content = document.getElementById(id);
            let heading = "";
            if (id == "share-popup") {
              heading = " dlg-disable-heading";
            }
            if (content) {
              var promotion = EasyDialogBox.create(
                id,
                "dlg" + heading + " dlg-disable-footer dlg-disable-drag",
                text,
                content.innerHTML
              );
              promotion.onClose = promotion.destroy;
              promotion.show(300);
            }
            if (id == "compare-color-popup") {
              this.eventCompareColors();
            }
            if (id == "share-popup") {
              this.eventCopyShare();
            }
          },
          false
        );
      });

      const prodData = document.querySelector("[data-product-json]");
      if (prodData != null) {
        var productJson = JSON.parse(prodData.innerHTML);
        var storedProducts = JSON.parse(
          localStorage.getItem("tps__recently-viewed-products")
        );
        if (storedProducts) {
          if (storedProducts.length <= 10) {
            this.addProductEntry(productJson, storedProducts);
          }
        } else {
          this.addProductEntry(productJson, storedProducts);
        }
      }
    },

    addProductEntry: function (productJson, storedProducts) {
      if (storedProducts === null) storedProducts = [];
      var currentProductID = productJson.id;
      var currentProductHandle = productJson.handle;
      var product = {
        handle: currentProductHandle,
        id: currentProductID,
      };
      if (JSON.parse(localStorage.getItem("product")) != currentProductHandle) {
        localStorage.setItem("product", JSON.stringify(product));
      }
      for (var i = storedProducts.length; i--; ) {
        var curProduct = storedProducts[i];
        if (curProduct.handle === product.handle) {
          storedProducts.splice(i, 1);
          break;
        }
      }
      storedProducts.push(product);
      if (localStorage.getItem(storedProducts)) {
        localStorage.getItem(
          "tps__recently-viewed-products",
          JSON.stringify(storedProducts)
        );
      } else {
        localStorage.setItem(
          "tps__recently-viewed-products",
          JSON.stringify(storedProducts)
        );
      }
    },

    eventMediaGalleryProduct: function () {
      const thumbnails_gallery = document.querySelector(
        ".tps__swiper-gallery-thumbnails"
      );
      const gallery = document.querySelector(".tps__swiper-gallery");
      var thumbnails;
      var thumbnails_mobile;
      var gallery_slide;
      var gallery_slide_mobile;
      if (thumbnails_gallery) {
        if (thumbnails_gallery.classList.contains("tps__swiper-vertical")) {
          var thumbnails = new Swiper(
            ".tps__swiper-gallery-thumbnails.tps__swiper-vertical",
            {
              spaceBetween: 10,
              slidesPerView: 8,
              freeMode: true,
              direction: "vertical",
              watchSlidesProgress: true,
            }
          );
        } else {
          var thumbnails = new Swiper(".tps__swiper-gallery-thumbnails", {
            spaceBetween: 10,
            slidesPerView: 5,
            freeMode: true,
            watchSlidesProgress: true,
            navigation: {
              nextEl: ".swiper-next",
              prevEl: ".swiper-prev",
            },
          });
        }
      }
      if (gallery) {
        if (thumbnails) {
          var gallery_slide = new Swiper(".tps__swiper-gallery", {
            loop: false,
            speed: 600,
            navigation: {
              nextEl: ".swiper-next",
              prevEl: ".swiper-prev",
            },
            thumbs: {
              swiper: thumbnails,
            },
          });
        } else {
          const autoplaying = gallery.dataset.autoplay === "true";
          const itemMobile = gallery?.dataset.mobile;
          const spacing = gallery?.dataset.spacing;
          const row = gallery?.dataset.sectionId;
          var gallery_slide = new Swiper(".tps__swiper-gallery", {
            slidesPerView: itemMobile,
            spaceBetween: Number(spacing),
            autoplay: autoplaying,
            speed: 600,
            loop: false,
            grid: {
              rows: row,
            },
            navigation: {
              nextEl: ".swiper-next",
              prevEl: ".swiper-prev",
            },
            pagination: {
              clickable: true,
              el: ".swiper-pagination",
            },
          });
        }
      }

      const thumbnails_gallery_mobile = document.querySelector(
        ".tps__swiper-gallery-thumbnails-mobile"
      );
      const gallery_mobile = document.querySelector(
        ".tps__swiper-gallery-mobile"
      );

      if (thumbnails_gallery_mobile && gallery_mobile) {
        var thumbnails_mobile = new Swiper(
          ".tps__swiper-gallery-thumbnails-mobile",
          {
            spaceBetween: 10,
            slidesPerView: 4,
            freeMode: true,
            watchSlidesProgress: true,
            navigation: {
              nextEl: ".swiper-next",
              prevEl: ".swiper-prev",
            },
          }
        );
      }

      if (thumbnails_mobile) {
        var gallery_slide_mobile = new Swiper(".tps__swiper-gallery-mobile", {
          spaceBetween: 0,
          speed: 600,
          loop: false,
          navigation: {
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          },
          thumbs: {
            swiper: thumbnails_mobile,
          },
        });
      } else {
        var gallery_slide_mobile = new Swiper(".tps__swiper-gallery-mobile", {
          slidesPerView: 1,
          longSwipesMs: 600,
          spaceBetween: 0,
          autoplay: false,
          loop: false,
          navigation: {
            nextEl: ".swiper-next",
            prevEl: ".swiper-prev",
          },
          pagination: {
            clickable: true,
            el: ".swiper-pagination",
          },
        });
      }

      document
        .querySelectorAll(".tps__product-details-infor .tps__option-swatch")
        .forEach((button) => {
          button.addEventListener(
            "click",
            (e) => {
              const target = e.currentTarget;
              setTimeout(function () {
                var options = Array.from(
                  target
                    .closest("variant-selects")
                    .querySelectorAll(".tps__option-swatch.active"),
                  (select) => select.getAttribute("data-value")
                );
                var variantData = JSON.parse(
                  target
                    .closest("variant-selects")
                    .querySelector('[type="application/json"]').textContent
                );
                var currentVariant = variantData.find((variant) => {
                  return !variant.options
                    .map((option, index) => {
                      return options[index] === option;
                    })
                    .includes(false);
                });
                if (!currentVariant) return;
                if (!currentVariant.featured_media) return;
                var featured_media_id = currentVariant.featured_media.id;
                var position = target
                  .closest(".tps__template-product")
                  .querySelector(
                    `.product__media-gallery [data-media-id="${featured_media_id}"]`
                  )
                  .getAttribute("data-position");
                if (gallery_slide) {
                  gallery_slide.slideTo(position - 1, 600);
                }
                if (gallery_slide_mobile) {
                  gallery_slide_mobile.slideTo(position - 1, 600);
                }
              }, 100);
            },
            false
          );
        });

      if (gallery_slide) {
        gallery_slide.on("slideChange", function () {
          var index = gallery_slide.realIndex + 1;
          var slide = gallery.querySelector(
            `.gallery-img[data-position="${index}"]`
          );
          if (slide.classList.contains("model")) {
            gallery_slide.allowTouchMove = false;
          } else {
            gallery_slide.allowTouchMove = true;
          }
        });
      }

      gallery_slide_mobile.on("slideChange", function () {
        var index = gallery_slide_mobile.realIndex + 1;
        var slide = gallery_mobile.querySelector(
          `.gallery-img[data-position="${index}"]`
        );
        if (slide.classList.contains("model")) {
          gallery_slide_mobile.allowTouchMove = false;
        } else {
          gallery_slide_mobile.allowTouchMove = true;
        }
      });
    },

    productMedia: function () {
      var position = 0;
      document.querySelectorAll(options.photoZoomImage).forEach((item) => {
        var items = this.getProductItems(item);
        item.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            if (
              target.classList.contains("external_video") ||
              target.classList.contains("video") ||
              target.classList.contains("model")
            ) {
              return;
            }
            if (target.getAttribute("data-position")) {
              position = target.getAttribute("data-position");
            } else if (
              target
                .closest(".product__media-list")
                .querySelector(".swiper-slide-active")
            ) {
              position = target
                .closest(".product__media-list")
                .querySelector(".swiper-slide-active")
                .getAttribute("data-position");
            }
            const gallery = GLightbox({
              elements: items,
              startAt: position - 1,
              openEffect: "fade",
              closeEffect: "fade",
              loop: false,
              draggable: false,
              autoplayVideos: false,
            });
            gallery.open();
          },
          false
        );
      });

      var sectionId = document
        .querySelector(".tps__template-product")
        .getAttribute("data-section");
      var productMediaTypeVideoDesktop = document.querySelectorAll(
        "[data-product-media-type-video-desktop]"
      );
      productMediaTypeVideoDesktop.forEach(function (el) {
        theme.ProductVideo.init(el, sectionId);
      });

      var productMediaTypeVideoMobile = document.querySelectorAll(
        "[data-product-media-type-video-mobile]"
      );
      productMediaTypeVideoMobile.forEach(function (el) {
        theme.ProductVideo.init(el, sectionId);
      });

      var modelViewerElementsDesktop = document.querySelectorAll(
        "[data-product-media-type-model-desktop]"
      );
      if (modelViewerElementsDesktop.length >= 1) {
        theme.ProductModel.init(modelViewerElementsDesktop, sectionId);
      }

      var modelViewerElementsMobile = document.querySelectorAll(
        "[data-product-media-type-model-mobile]"
      );
      if (modelViewerElementsMobile.length >= 1) {
        theme.ProductModel.init(modelViewerElementsMobile, sectionId);
      }
    },

    getProductItems: function (item) {
      var items = [];
      item
        .closest(".product__media-list")
        .querySelectorAll(options.mediaImage)
        .forEach((img) => {
          var $this = img,
            src = $this.getAttribute("data-src"),
            width = $this.getAttribute("data-width");
          if ($this.classList.contains("video")) {
            var source = $this.getAttribute("data-source-url");
            items.push({
              href: source,
              type: "video",
              source: "local",
              width: width,
            });
          } else if ($this.classList.contains("external_video")) {
            var data_source = $this.getAttribute("data-source");
            var data_source_id = $this.getAttribute("data-video-id");
            var source = "youtube";
            var source_url = "";
            if (data_source == "youtube") {
              source = "youtube";
              source_url =
                "https://www.youtube.com/watch?v=" + data_source_id + "";
            } else {
              source = "vimeo";
              source_url = "https://vimeo.com/" + data_source_id + "";
            }
            items.push({
              href: source_url,
              type: "video",
              source: source,
              width: width,
            });
          } else {
            items.push({
              href: src,
            });
          }
        });
      return items;
    },

    eventCopyShare: function () {
      document.querySelectorAll(options.shareCopy).forEach((action) => {
        action.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            var text = document.getElementById("share-popup-input");
            text.select();
            text.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(text.value);
            target.classList.add("active");
          },
          false
        );
      });
    },

    eventCompareColors: function () {
      document.querySelectorAll(options.compareColorsBtn).forEach((compare) => {
        compare.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            const color = target.getAttribute("data-color");
            const image = target.getAttribute("data-image");
            if (target.classList.contains("active")) {
              target.classList.remove("active");
              document
                .querySelector(
                  ".dlg .item-compare-color." + color.replace(" ", "-") + ""
                )
                .remove();
              setTimeout(function () {
                if (!document.querySelector(".dlg .item-compare-color")) {
                  document
                    .querySelector(".dlg .compare-color-empty")
                    .classList.remove("d-none");
                }
              }, 100);
            } else {
              document
                .querySelector(".dlg .compare-color-empty")
                .classList.add("d-none");
              target.classList.add("active");
              if (color && image) {
                const html =
                  '<div class="image"><img src="' +
                  image +
                  '" alt="' +
                  color +
                  '"></div><p class="mt-10 heading-color capitalize">' +
                  color +
                  "</p>";
                const el = document.createElement("div");
                el.classList.add("item-compare-color", color.replace(" ", "-"));
                el.innerHTML = html;
                document
                  .querySelector(".dlg .tps__compare-colors-list")
                  .appendChild(el);
              }
            }
          },
          false
        );
      });
    },

    eventProductTabs: function () {
      document.querySelectorAll(options.navTabs).forEach((tabToggle) => {
        tabToggle.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            const tab_id = target.getAttribute("data-block-id");
            if (!target.closest(".data.item").classList.contains("active")) {
              for (var item of document.querySelectorAll(".data.item")) {
                item.classList.remove("active");
              }
              for (var item of document.querySelectorAll(options.tabContent)) {
                item.classList.remove("active");
                item.querySelector(".tab-panel").style.display = "none";
              }
              const conditions = document.getElementById(tab_id);
              conditions.classList.add("active");
              conditions.querySelector(".tab-panel").style.display = "block";
              target.closest(".data.item").classList.add("active");
            }
          },
          false
        );
      });

      document
        .querySelectorAll(options.accorditionTabs)
        .forEach((tabToggle) => {
          tabToggle.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const tab_id = target.getAttribute("data-block-id");
              const conditions = document.getElementById(tab_id);
              if (!conditions) return;
              if (conditions.classList.contains("active")) {
                slideAnime({
                  target: conditions.querySelector(".tab-panel"),
                  animeType: "slideUp",
                });
                conditions.classList.remove("active");
              } else {
                for (var item of document.querySelectorAll(
                  options.tabContent
                )) {
                  item.classList.remove("active");
                  slideAnime({
                    target: item.querySelector(".tab-panel"),
                    animeType: "slideUp",
                  });
                }
                slideAnime({
                  target: conditions.querySelector(".tab-panel"),
                  animeType: "slideDown",
                });
                conditions.classList.add("active");
              }
            },
            false
          );
        });

      if (document.querySelector(".inside-product-main-infomation")) {
        const el = document.querySelector(options.productInfomationTab);
        el.classList.remove("hidden");
        setTimeout(function () {
          el.querySelector(".loading").remove();
          el.appendChild(
            document.querySelector(
              ".inside-product-main-infomation .product.info.detailed"
            )
          );
        }, 500);
      }
    },

    eventVisitors: function () {
      const element = document.querySelector(options.visitors);
      if (!element) return;
      const max = Number(element.getAttribute("data-count-range-max"));
      const min = Number(element.getAttribute("data-count-range-min"));
      const view_duration = Number(element.getAttribute("data-view-duration"));
      var visitors = Math.floor(Math.random() * (max - min + 1)) + min;
      document.querySelector(".tps__visitor-count").innerHTML = visitors;
      setInterval(function () {
        var visitors = Math.floor(Math.random() * (max - min + 1)) + min;
        document.querySelector(".tps__visitor-count").innerHTML = visitors;
      }, view_duration * 1000);
      element.style.display = "block";
    },

    stickyAddToCartButton: function () {
      document.addEventListener("DOMContentLoaded", function () {
        var productCartButton = document.querySelector(".product-form__submit"),
          stickyAddToCartButton = document.querySelector(
            "#tps__sticky-addcart"
          ),
          previousTop = 0;
        if (
          stickyAddToCartButton &&
          stickyAddToCartButton.classList.contains("only-show-desktop")
        ) {
          if (window.innerWidth >= 992) {
            document.body.classList.add("sticky-addtocart-show");
          }
        } else {
          document.body.classList.add("sticky-addtocart-show");
        }
        if (
          "IntersectionObserver" in window &&
          "IntersectionObserverEntry" in window &&
          "intersectionRatio" in window.IntersectionObserverEntry.prototype &&
          stickyAddToCartButton
        ) {
          let productCartButtonObserver = new IntersectionObserver(
            function (entries, observer) {
              entries.forEach(function (entry) {
                let showstickyAddToCartButton =
                  entry.boundingClientRect.top < previousTop &&
                  entry.boundingClientRect.top < 0;
                if (showstickyAddToCartButton) {
                  stickyAddToCartButton.classList.add("sticky-addcart-show");
                } else {
                  stickyAddToCartButton.classList.remove("sticky-addcart-show");
                }
                previousTop = entry.boundingClientRect.top;
              });
            },
            { threshold: 0.5 }
          );
          productCartButtonObserver.observe(productCartButton);
        }
      });
    },

    eventCountdowProduct: function () {
      const element = document.querySelector(options.countdowProduct);
      if (!element) return;
      const dataProductID = document
        .querySelector(options.templateProduct)
        .getAttribute("data-product-id");
      fetch("/admin/orders.json")
        .then((res) => res.json())
        .then((orders) => {
          var sum = 0;
          var orders = orders.orders;
          orders.forEach(function (item, index) {
            item.line_items.forEach(function (itemi, index) {
              if (itemi.product_id == dataProductID) {
                var num = itemi.quantity;
                sum += num || 0;
              }
            });
          });
          var variants = parseInt(
            element.querySelector(".tps__count").innerText
          );
          var count = variants + sum;
          var a = 100 * (variants / count);
          setTimeout(function () {
            element.querySelector(".progressbar div").style.width = a + "%";
          }, 300);
        })
        .catch((error) => {
          throw error;
        });
      setInterval(function () {
        fetch("/admin/orders.json")
          .then((res) => res.json())
          .then((orders) => {
            var sumqt = 0;
            var orders = orders.orders;
            orders.forEach(function (item, index) {
              item.line_items.forEach(function (itemi, index) {
                if (itemi.product_id == dataProductID) {
                  var num = itemi.quantity;
                  sumqt += num || 0;
                }
              });
            });
            var sumqty = 0;
            fetch("/admin/products/" + dataProductID + "/variants.json")
              .then((res) => res.json())
              .then((variant) => {
                var variants = variant.variants;
                variants.forEach(function (itemvariant, index) {
                  var numqty = itemvariant.inventory_quantity;
                  sumqty += numqty || 0;
                });
                element.querySelector(".tps__count").innerHTML = sumqty;
              })
              .catch((error) => {
                throw error;
              });
            var variants = parseInt(
              element.querySelector(".tps__count").innerText
            );
            var count = variants + sumqt;
            var a = 100 * (variants / count);
            setTimeout(function () {
              element.querySelector(".progressbar div").style.width = a + "%";
            }, 300);
          })
          .catch((error) => {
            throw error;
          });
      }, 10000);
    },

    eventProductBoughTogether: function () {
      var boughTogether = document.querySelector(
        '.productBoughTogether[type="application/json"]'
      );
      if (!boughTogether) return;
      var variantData = JSON.parse(boughTogether.innerText);
      var query = "";
      variantData.forEach((e, key, variantData) => {
        if (!Object.is(variantData.length - 1, key)) {
          query += e + "%20OR%20id:";
        } else {
          query += e;
        }
      });
      var productAjaxURL =
        "?q=id:" + query + "&section_id=product-bough-together";
      fetch(`${window.routes.search_url}${productAjaxURL}`)
        .then((response) => response.text())
        .then(async (responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          document.getElementById("tps__product-bought-together").innerHTML =
            html.querySelector(".tps__bought-together").innerHTML;
        })
        .catch((e) => {
          throw error;
        })
        .finally(() => {
          this.eventProductBoughTogetherAction();
          TpsLazyloadImg.init();
        });
    },

    eventProductBoughTogetherAction: function () {
      var _this = this;
      document
        .querySelectorAll(".bought-together-checkbox")
        .forEach((checkbox) => {
          checkbox.addEventListener(
            "change",
            (event) => {
              var target = event.target;
              var total_price = 0,
                total_compare_price = 0,
                save_price = 0,
                price,
                compare_price,
                pro_handle = event.target.getAttribute("data-handle");
              var img = target
                .closest("#tps__product-bought-together")
                .querySelector(".product-bought-image-item." + pro_handle + "");
              if (target.checked) {
                img.classList.add("select");
                target
                  .closest(".product-bought-together-item")
                  .classList.add("select");
                target
                  .closest(".product-bought-together-item")
                  .querySelector(".product-variant-option")
                  .removeAttribute("disabled");
                target
                  .closest(".product-bought-together-item")
                  .querySelector(".quantity")
                  .removeAttribute("disabled");
              } else {
                img.classList.remove("select");
                target
                  .closest(".product-bought-together-item")
                  .classList.remove("select");
                target
                  .closest(".product-bought-together-item")
                  .querySelector(".product-variant-option")
                  .setAttribute("disabled", true);
                target
                  .closest(".product-bought-together-item")
                  .querySelector(".quantity")
                  .setAttribute("disabled", true);
              }
              setTimeout(function () {
                var bought_together_select = document.querySelectorAll(
                  ".product-bought-together-item.select"
                );
                bought_together_select.forEach((item) => {
                  var option = item.querySelector(".product-variant-option");
                  price = option.getAttribute("data-price");
                  compare_price = option.getAttribute("data-compare-price");
                  total_price = total_price + Number(price);
                  total_compare_price =
                    total_compare_price + Number(compare_price);
                });
                save_price = total_compare_price - total_price;
                _this.eventProductBoughTogetherUpdatePrice(
                  total_price,
                  total_compare_price,
                  save_price
                );
                if (bought_together_select.length <= 1) {
                  document
                    .querySelector(".bought-together-submit")
                    .setAttribute("disabled", true);
                } else {
                  document
                    .querySelector(".bought-together-submit")
                    .removeAttribute("disabled");
                }
              }, 50);
            },
            false
          );
        });
      document
        .querySelectorAll(
          "#tps__product-bought-together .product-variant-option"
        )
        .forEach((select) => {
          select.addEventListener(
            "change",
            (event) => {
              var target = event.target;
              var total_price = 0,
                total_compare_price = 0,
                save_price = 0,
                image =
                  target.options[target.selectedIndex].getAttribute(
                    "data-image"
                  ),
                price =
                  target.options[target.selectedIndex].getAttribute(
                    "data-price"
                  ),
                pro_handle = target.getAttribute("data-handle"),
                compare_price =
                  target.options[target.selectedIndex].getAttribute(
                    "data-compare-price"
                  );
              var img = target
                .closest("#tps__product-bought-together")
                .querySelector(".product-bought-image-item." + pro_handle + "")
                .querySelector("img");
              if (img) {
                img.removeAttribute("srcset");
                img.setAttribute("src", image);
              }
              var info_price = target
                .closest(".product-bought-together-item")
                .querySelector(".info-price");
              info_price.querySelector(".price__regular .price").innerHTML =
                Shopify.formatMoney(price, cartStrings.money_format);
              const tps__price = info_price.querySelector(".tps__price");
              tps__price.classList.remove("price--sold-out", "price--on-sale");
              tps__price
                .querySelector(".price__regular .price")
                .classList.remove("special-price");
              if (compare_price && compare_price > price) {
                const compare_format = Shopify.formatMoney(
                  compare_price,
                  cartStrings.money_format
                );
                tps__price.querySelector(".compare-price").innerHTML =
                  compare_format;
                tps__price.classList.add("price--on-sale");
                tps__price
                  .querySelector(".price__regular .price")
                  .classList.add("special-price");
              }
              target.setAttribute("data-price", price);
              target.setAttribute("data-compare-price", compare_price);
              document
                .querySelectorAll(".product-bought-together-item.select")
                .forEach((item) => {
                  var option = item.querySelector(".product-variant-option");
                  price = option.getAttribute("data-price");
                  compare_price = option.getAttribute("data-compare-price");
                  total_price = total_price + Number(price);
                  total_compare_price =
                    total_compare_price + Number(compare_price);
                });
              save_price = total_compare_price - total_price;
              _this.eventProductBoughTogetherUpdatePrice(
                total_price,
                total_compare_price,
                save_price
              );
            },
            false
          );
        });

      document.querySelectorAll(".bought-together-submit").forEach((button) => {
        button.addEventListener(
          "click",
          this.submitBoughtTogether.bind(this),
          false
        );
      });
    },

    submitBoughtTogether: function (event) {
      event.preventDefault();
      const target = event.currentTarget;
      const cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");
      const form = document.getElementById("tps__bought-together-form");
      const config = fetchConfig("json");
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      delete config.headers["Content-Type"];
      const formData = new FormData(form);
      if (cart) {
        formData.append(
          "sections",
          cart.getSectionsToRender().map((section) => section.id)
        );
        formData.append("sections_url", window.location.pathname);
      }
      config.body = formData;
      target.classList.add("btn-loading");
      fetch(`${routes.cart_add_url}.js`, config)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          fetch("/cart.json")
            .then((res) => res.json())
            .then((cart) => {
              document.querySelectorAll(".cart-count").forEach((el) => {
                el.innerHTML = cart.item_count;
              });
              if (document.querySelector("header-total-price")) {
                document.querySelector("header-total-price").updateTotal(cart);
              }
            })
            .catch((error) => {
              throw error;
            });
          const parsedState = JSON.parse(state);
          cart.getSectionsToRender().forEach((section) => {
            const elementToReplace = document.getElementById(section.id);
            const html = new DOMParser().parseFromString(
              parsedState.sections[section.id],
              "text/html"
            );
            elementToReplace.innerHTML =
              html.querySelector("#form-mini-cart").innerHTML;
            const cart_threshold = document.querySelector(
              ".tps__cart-thres-js"
            );
            if (cart_threshold) {
              if (
                html
                  .querySelector(".tps__cart-thres-js")
                  .classList.contains("cart_shipping_free")
              ) {
                cart_threshold.classList.add("cart_shipping_free");
              } else {
                cart_threshold.classList.remove("cart_shipping_free");
              }
              if (
                cart_threshold.querySelector(".tps__cart-thres") &&
                html.querySelector(".tps__cart-thres")
              ) {
                cart_threshold.querySelector(".tps__cart-thres").innerHTML =
                  html.querySelector(".tps__cart-thres").innerHTML;
              }
              setTimeout(function () {
                cart_threshold
                  .querySelector(".percent_shipping_bar")
                  .setAttribute(
                    "style",
                    html
                      .querySelector(".percent_shipping_bar")
                      .getAttribute("style")
                  );
              }, 500);
            }
            const countdown = cart.querySelector(".cart-countdown-time");
            const html_countdown = html.querySelector(".cart-countdown-time");
            if (countdown && html_countdown) {
              countdown.innerHTML = html_countdown.innerHTML;
              cart.countdownTimer();
            }
          });
          cart.cartAction();
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          target.classList.remove("btn-loading");
          cart.open();
          TpsLazyloadImg.init();
        });
    },

    eventProductBoughTogetherUpdatePrice: function (
      total_price,
      total_compare_price,
      save_price
    ) {
      var total = document.querySelector(
        ".bought-together-container .total-product"
      );
      if (total) {
        total.querySelector(".saved-price .price").innerHTML =
          Shopify.formatMoney(save_price, cartStrings.money_format);
        total.querySelector(
          ".tps__total-price .price__sale .price-item"
        ).innerHTML = Shopify.formatMoney(
          total_compare_price,
          cartStrings.money_format
        );
        total.querySelector(".tps__total-price .price").innerHTML =
          Shopify.formatMoney(total_price, cartStrings.money_format);
        if (total_compare_price > total_price) {
          total
            .querySelector(".tps__total-price")
            .classList.add("price--on-sale");
          total
            .querySelector(".tps__total-price .price")
            .classList.add("special-price");
        } else {
          total
            .querySelector(".tps__total-price")
            .classList.remove("price--on-sale");
          total
            .querySelector(".tps__total-price .price")
            .classList.remove("special-price");
        }
        if (save_price > 1) {
          total.querySelector(".saved-price").classList.add("d-block");
          total.querySelector(".saved-price").classList.remove("d-none");
        } else {
          total.querySelector(".saved-price").classList.add("d-none");
          total.querySelector(".saved-price").classList.remove("d-block");
        }
      }
    },

    eventProductGroup: function () {
      var group = document.querySelector(
        '.productGroup[type="application/json"]'
      );
      if (!group) return;
      var variantData = JSON.parse(group.innerText);
      var query = "";
      variantData.forEach((e, key, variantData) => {
        if (!Object.is(variantData.length - 1, key)) {
          query += e + "%20OR%20id:";
        } else {
          query += e;
        }
      });
      var productAjaxURL = "?q=id:" + query + "&section_id=product-grouped";
      fetch(`${window.routes.search_url}${productAjaxURL}`)
        .then((response) => response.text())
        .then(async (responseText) => {
          const html = new DOMParser().parseFromString(
            responseText,
            "text/html"
          );
          document.getElementById("tps__product-group").innerHTML =
            html.querySelector(".tps__product-group").innerHTML;
        })
        .catch((e) => {
          throw error;
        })
        .finally(() => {
          this.eventProductGroupAction();
          TpsLazyloadImg.init();
        });
    },

    eventProductGroupAction: function () {
      document
        .querySelectorAll("#tps__product-group .product-variant-option")
        .forEach((select) => {
          select.addEventListener(
            "change",
            (event) => {
              var target = event.target;
              var image =
                  target.options[target.selectedIndex].getAttribute(
                    "data-image"
                  ),
                price =
                  target.options[target.selectedIndex].getAttribute(
                    "data-price"
                  ),
                pro_handle = target.getAttribute("data-handle"),
                compare_price =
                  target.options[target.selectedIndex].getAttribute(
                    "data-compare-price"
                  );
              var img = target
                .closest("#tps__product-group")
                .querySelector(".product-group-image-item." + pro_handle + "")
                .querySelector("img");
              if (img) {
                img.removeAttribute("srcset");
                img.setAttribute("src", image);
              }
              var info_price = target
                .closest(".product-group-item")
                .querySelector(".info-price");
              info_price.querySelector(".price__regular .price").innerHTML =
                Shopify.formatMoney(price, cartStrings.money_format);
              const tps__price = info_price.querySelector(".tps__price");
              tps__price.classList.remove("price--sold-out", "price--on-sale");
              tps__price
                .querySelector(".price__regular .price")
                .classList.remove("special-price");
              if (compare_price && compare_price > price) {
                const compare_format = Shopify.formatMoney(
                  compare_price,
                  cartStrings.money_format
                );
                tps__price.querySelector(".compare-price").innerHTML =
                  compare_format;
                tps__price.classList.add("price--on-sale");
                tps__price
                  .querySelector(".price__regular .price")
                  .classList.add("special-price");
              }
              target.setAttribute("data-price", price);
              target.setAttribute("data-compare-price", compare_price);
            },
            false
          );
        });

      let totalQty = 0;
      const classQty = document.querySelectorAll(
        ".quantity__input-product-group"
      );
      classQty.forEach((input) => {
        let valueQtyDefault = input.value;
        let valueAsDefault = parseFloat(valueQtyDefault);
        if (!isNaN(valueAsDefault)) {
          totalQty += valueAsDefault;
        }
        input.addEventListener("change", () => {
          totalQty = 0;
          classQty.forEach((value) => {
            let valueQty = value.value;
            let valueAsQty = parseFloat(valueQty);
            if (!isNaN(valueAsQty)) {
              totalQty += valueAsQty;
            }
          });
        });
      });
      document.querySelectorAll(".product-group-submit").forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            if (totalQty === 0) {
              const content = document.querySelector(
                ".form-infor .add-cart-error"
              );
              const messageErrQty = button.getAttribute(
                "data-add-cart-err-qty"
              );
              if (!content) return;
              var error_message = EasyDialogBox.create(
                "add_cart_error",
                "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                "",
                (content.innerHTML = messageErrQty)
              );
              error_message.onClose = error_message.destroy;
              error_message.show();
            } else {
              this.submitProductGroup(event);
            }
          },
          false
        );
      });

      document.querySelectorAll(".product-group-buy-now").forEach((button) => {
        button.addEventListener(
          "click",
          (event) => {
            if (totalQty === 0) {
              const content = document.querySelector(
                ".form-infor .add-cart-error"
              );
              const messageErrQty = button.getAttribute(
                "data-add-cart-err-qty"
              );
              if (!content) return;
              var error_message = EasyDialogBox.create(
                "add_cart_error",
                "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                "",
                (content.innerHTML = messageErrQty)
              );
              error_message.onClose = error_message.destroy;
              error_message.show();
            } else {
              this.submitNowProductGroup(event);
            }
          },
          false
        );
      });
    },

    submitProductGroup: function (event) {
      event.preventDefault();
      const target = event.currentTarget;
      const cart =
        document.querySelector("cart-notification") ||
        document.querySelector("cart-drawer");
      const form = document.getElementById("form-product-grouped");
      const config = fetchConfig("json");
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      delete config.headers["Content-Type"];
      let openMiniCart = 0;
      const formData = new FormData(form);
      if (cart) {
        formData.append(
          "sections",
          cart.getSectionsToRender().map((section) => section.id)
        );
        formData.append("sections_url", window.location.pathname);
      }
      config.body = formData;
      target.classList.add("btn-loading");
      fetch(`${routes.cart_add_url}.js`, config)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          fetch("/cart.json")
            .then((res) => res.json())
            .then((cart) => {
              document.querySelectorAll(".cart-count").forEach((el) => {
                el.innerHTML = cart.item_count;
              });
              if (document.querySelector("header-total-price")) {
                document.querySelector("header-total-price").updateTotal(cart);
              }
            })
            .catch((error) => {
              throw error;
            });
          const parsedState = JSON.parse(state);
          if (parsedState.message) {
            const content = document.querySelector(
              ".form-infor .add-cart-error"
            );
            if (!content) return;
            var error_message = EasyDialogBox.create(
              "add_cart_error",
              "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
              "",
              (content.innerHTML = parsedState.description)
            );
            error_message.onClose = error_message.destroy;
            error_message.show();
          } else {
            parsedState.items.forEach((e) => {
              if (e.quantity > 0) {
                openMiniCart = 1;
              }
            });
            cart.getSectionsToRender().forEach((section) => {
              const elementToReplace = document.getElementById(section.id);
              const html = new DOMParser().parseFromString(
                parsedState.sections[section.id],
                "text/html"
              );
              elementToReplace.innerHTML =
                html.querySelector("#form-mini-cart").innerHTML;
              const cart_threshold = document.querySelector(
                ".tps__cart-thres-js"
              );
              if (cart_threshold) {
                if (
                  html
                    .querySelector(".tps__cart-thres-js")
                    .classList.contains("cart_shipping_free")
                ) {
                  cart_threshold.classList.add("cart_shipping_free");
                } else {
                  cart_threshold.classList.remove("cart_shipping_free");
                }
                cart_threshold.querySelector(".tps__cart-thres").innerHTML =
                  html.querySelector(".tps__cart-thres").innerHTML;
                setTimeout(function () {
                  cart_threshold
                    .querySelector(".percent_shipping_bar")
                    .setAttribute(
                      "style",
                      html
                        .querySelector(".percent_shipping_bar")
                        .getAttribute("style")
                    );
                }, 500);
              }
              const countdown = cart.querySelector(".cart-countdown-time");
              const html_countdown = html.querySelector(".cart-countdown-time");
              if (countdown && html_countdown) {
                countdown.innerHTML = html_countdown.innerHTML;
                cart.countdownTimer();
              }
            });
            cart.cartAction();
          }
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          target.classList.remove("btn-loading");
          if (openMiniCart === 1) {
            cart.open();
          }
          TpsLazyloadImg.init();
        });
    },

    submitNowProductGroup: function (event) {
      event.preventDefault();
      const form = document.getElementById("form-product-grouped");
      const config = fetchConfig("json");
      config.headers["X-Requested-With"] = "XMLHttpRequest";
      delete config.headers["Content-Type"];
      const formData = new FormData(form);
      config.body = formData;
      fetch(`${routes.cart_add_url}.js`, config)
        .then((response) => {
          return response.text();
        })
        .then((state) => {
          const parsedState = JSON.parse(state);
          if (parsedState.items) {
            window.location.href = "/checkout";
          } else {
            const content = document.querySelector(
              ".form-infor .add-cart-error"
            );
            if (!content) return;
            var error_message = EasyDialogBox.create(
              "add_cart_error",
              "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
              "",
              (content.innerHTML = parsedState.description)
            );
            error_message.onClose = error_message.destroy;
            error_message.show();
          }
        })
        .catch((e) => {
          throw e;
        });
    },

    showPopupStockNotify: function () {
      const stockClass = document.querySelectorAll(".product-notify-stock");
      const _this = this;
      stockClass.forEach((stock) => {
        stock.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const variantId = target.getAttribute("data-product-variant");
          e.preventDefault();
          _this.fetchDataStockNotifySection(variantId);
        });
      });
    },

    fetchDataStockNotifySection: function (variantId) {
      const url = "/variants/" + variantId + "/?section_id=stock-notify";
      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = newParser.parseFromString(responseText, "text/html");
          const id = html.querySelector("#tps-stock-notify");
          const text = id.getAttribute("data-stock-title");
          if (id) {
            var createPopupStock = EasyDialogBox.create(
              "stockNotify",
              "dlg dlg-disable-footer dlg-disable-drag",
              text,
              id.innerHTML
            );
            createPopupStock.onClose = createPopupStock.destroy;
            createPopupStock.show();
          }
        })
        .catch((e) => {
          throw e;
        });
    },

    actionDropdownSwatches: function () {
      document.querySelectorAll("[data-swatches-value]").forEach((items) => {
        items.addEventListener(
          "click",
          (e) => {
            const target = e.currentTarget;
            if (
              !target
                .closest(".tps__color-dropdown")
                .classList.contains("isClicked")
            ) {
              for (var item of document.querySelectorAll(
                ".tps__color-dropdown"
              )) {
                item.classList.remove("isClicked");
              }
              target.closest(".tps__color-dropdown").classList.add("isClicked");
            } else {
              target
                .closest(".tps__color-dropdown")
                .classList.remove("isClicked");
            }
          },
          false
        );
      });
      document
        .querySelectorAll(".tps__product-color-swatches-dropdown")
        .forEach((swatches) => {
          swatches.addEventListener("click", (e) => {
            const target = e.currentTarget;
            const valueSwatch = target.dataset.value;
            const container = target.closest(".tps__color-dropdown");
            container.querySelector(
              ".tps__color-dropdown-action .tps__color-dropdown-value"
            ).innerHTML = valueSwatch;
            target
              .closest(".tps__color-dropdown")
              .classList.remove("isClicked");
          });
        });
    },

    eventSkeleton: function () {
      window.setTimeout(function () {
        this.document
          .getElementById("MainContent")
          .classList.remove("skeleton-product-detail");
      }, 1500);
    },
  };
})();
TpsEventMainProductShopify.init();

var TpsEventProductSidebar = (function () {
  return {
    init: function () {
      this.initProductSidebar();
      this.productSidebarAction();
    },
    initProductSidebar: function () {
      const _this = this;
      const sidebar = document.querySelector(".tps__product-sidebar");
      const sectionId = sidebar?.getAttribute("data-section-id");
      const sidebarDrawer = document.querySelector(".tps-sidebar-content");
      const viewLayout = sidebar?.getAttribute("data-view");
      const domRender = document.querySelector(
        ".tps__template-product-sidebar"
      );
      const showSide = sidebar?.getAttribute("data-show-side");
      const urlInfo = window.location.href;
      const left = urlInfo.indexOf("view=left-sidebar") >= 1;
      const right = urlInfo.indexOf("view=right-sidebar") >= 1;
      const drawer = urlInfo.indexOf("view=drawer-sidebar") > -1;
      const url =
        "?section_id=" + sectionId + "&view=" + viewLayout + "-sidebar";
      if (sectionId !== undefined && viewLayout !== undefined) {
        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            let newParser = new DOMParser();
            const html = newParser.parseFromString(responseText, "text/html");
            const id = html.querySelector(
              "#product-sidebar-content"
            )?.innerHTML;
            if (left || right || drawer) {
              if (left || right) {
                domRender.innerHTML = id;
              } else if (drawer) {
                sidebarDrawer.innerHTML = id;
              }
              sidebarDrawer.innerHTML = id;
            } else {
              if (showSide == "true") {
                if (viewLayout == "left" || viewLayout == "right") {
                  domRender.innerHTML = id;
                } else if (viewLayout == "drawer") {
                  document.querySelector(
                    ".tps__template-main-product"
                  ).style.width = "100%";
                  document
                    .querySelector(".tps-sidebar-drawer")
                    .removeAttribute("style");
                  sidebarDrawer.innerHTML = id;
                }
                sidebarDrawer.innerHTML = id;
              }
            }
            if (Shopify.designMode) {
              if (showSide == "true") {
                if (viewLayout == "left" || viewLayout == "right") {
                  domRender.innerHTML = id;
                  document.querySelector(
                    ".tps__template-product-sidebar"
                  ).style.display = "block";
                  document.querySelector(
                    ".tps__template-main-product"
                  ).style.width = "75%";
                } else if (viewLayout == "drawer") {
                  sidebarDrawer.innerHTML = id;
                  document
                    .querySelector(".tps-sidebar-drawer")
                    .removeAttribute("style");
                  document.querySelector(
                    ".tps__template-main-product"
                  ).style.width = "100%";
                  document.querySelector(
                    ".tps__template-product-sidebar"
                  ).style.display = "none";
                }
                sidebarDrawer.innerHTML = id;
              } else {
                if (viewLayout == "left" || viewLayout == "right") {
                  document.querySelector(
                    ".tps__template-product-sidebar"
                  ).style.display = "none";
                }
                document.querySelector(
                  ".tps__template-main-product"
                ).style.width = "100%";
              }
            }
          })
          .catch((e) => {
            throw e;
          })
          .finally(() => {
            const removeSidebar = document.querySelector(".contain-sidebar");
            if (removeSidebar) {
              removeSidebar.remove();
            }
            TpsInstagramShopify.init();
            _this.initToggleSidebar();
            _this.productSidebarCheckLayout();
          });
      }
    },

    open: function () {
      const drawer = document.querySelector(".tps-sidebar-drawer");
      drawer.classList.add("tps__opend-popup-header");
      document
        .querySelector(".tps__overlay")
        .classList.remove("d-none-overlay");
      drawer.addEventListener(
        "transitionend",
        () => {
          drawer.focus();
        },
        { once: true }
      );
      document.body.addEventListener("click", this.onBodyClick);
    },

    close: function () {
      const drawer = document.querySelector(".tps-sidebar-drawer");
      drawer.classList.remove("tps__opend-popup-header");
      document.querySelector(".tps__overlay").classList.add("d-none-overlay");
      document.documentElement.classList.remove("hside_opened");
      document.body.removeEventListener("click", this.onBodyClick);
    },

    productSidebarAction: function () {
      const action = document.querySelector(".action-product-sidebar");
      const drawer = document.querySelector(".tps-sidebar-drawer");
      action?.addEventListener("click", () => {
        if (drawer.classList.contains("tps__opend-popup-header")) {
          this.close();
        } else {
          this.open();
        }
      });
      document
        .querySelector(".tps-sidebar-drawer-wrapper .close-button")
        ?.addEventListener("click", () => {
          this.close();
        });
      document.querySelector(".tps__overlay").addEventListener("click", () => {
        this.close();
      });
    },

    initToggleSidebar: function () {
      var item_parent = ".sidebar-item > .sidebar-title";
      document.querySelectorAll(item_parent).forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          const parent = target.parentElement;
          const sideContent = parent.querySelector(".sidebar-content");
          slideAnime({
            target: sideContent,
            animeType: "slideToggle",
          });
          if (item.closest(".sidebar-item").classList.contains("active")) {
            item.closest(".sidebar-item").classList.remove("active");
          } else {
            item.closest(".sidebar-item").classList.add("active");
          }
        });
      });
    },

    productSidebarCheckLayout: function () {
      const urlInfo = window.location.href;
      const left = urlInfo.indexOf("view=left-sidebar") > -1;
      const right = urlInfo.indexOf("view=right-sidebar") > -1;
      const drawer = urlInfo.indexOf("view=drawer-sidebar") > -1;
      if (left) {
        document.querySelector(".tps__template-product-sidebar").style.order =
          "-1";
      } else if (right) {
        document.querySelector(".tps__template-product-sidebar").style.order =
          "1";
      } else if (drawer) {
        document.querySelector(".tps-sidebar-drawer").removeAttribute("style");
        document.querySelector(".tps__template-main-product").style.width =
          "100%";
      }
    },
  };
})();
TpsEventProductSidebar.init();
document.addEventListener("shopify:section:load", function (event) {
  var section = event.target.querySelector(".tps__product-sidebar");
  if (section != undefined) {
    TpsEventProductSidebar.init();
  }
});

class ScrollReview extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", this.onButtonClick.bind(this));
  }
  onButtonClick(e) {
    e.preventDefault();
    let target = document.querySelector(".tps__product-tabs");
    if (target.querySelectorAll(".tab-content-all").length) {
      target = document.querySelector("[tab-review]");
    }
    if (target.classList.contains("inside-product-main-infomation")) {
      target = document.querySelector(".tps__product-tabs-content");
    }
    if (!target) return;
    var scrollContainer = target;
    do {
      scrollContainer = scrollContainer.parentNode;
      if (!scrollContainer) return;
      scrollContainer.scrollTop += 1;
    } while (scrollContainer.scrollTop == 0);

    var targetY = 0;
    do {
      if (target == scrollContainer) break;
      targetY += target.offsetTop;
    } while ((target = target.offsetParent));

    scroll = function (c, a, b, i) {
      i++;
      if (i > 30) return;
      c.scrollTop = a + ((b - a) / 30) * i;
      setTimeout(function () {
        scroll(c, a, b, i);
      }, 10);
    };
    scroll(scrollContainer, scrollContainer.scrollTop, targetY, 0);
    setTimeout(() => {
      this.eventProductTabs();
    }, 300);
  }
  eventProductTabs() {
    const target = document.querySelector("[tab-review]");
    if (!target) return;
    if (target.classList.contains("accordition")) {
      const tab_id = target.getAttribute("data-block-id");
      const conditions = document.getElementById(tab_id);
      if (!conditions) return;
      if (!conditions.classList.contains("active")) {
        for (var item of document.querySelectorAll(options.tabContent)) {
          item.classList.remove("active");
          slideAnime({
            target: item.querySelector(".tab-panel"),
            animeType: "slideUp",
          });
        }
        slideAnime({
          target: conditions.querySelector(".tab-panel"),
          animeType: "slideDown",
        });
        conditions.classList.add("active");
      }
    }
    if (target.classList.contains("is-nav-tabs")) {
      const tab_id = target.getAttribute("data-block-id");
      if (!target.closest(".data.item").classList.contains("active")) {
        for (var item of document.querySelectorAll(".data.item")) {
          item.classList.remove("active");
        }
        for (var item of document.querySelectorAll(options.tabContent)) {
          item.classList.remove("active");
          item.querySelector(".tab-panel").style.display = "none";
        }
        const conditions = document.getElementById(tab_id);
        conditions.classList.add("active");
        conditions.querySelector(".tab-panel").style.display = "block";
        target.closest(".data.item").classList.add("active");
      }
    }
  }
}
customElements.define("review-scroll", ScrollReview);
