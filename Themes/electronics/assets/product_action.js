"use strict";
const parser = new DOMParser();
var TpsWishlistHeader = (function () {
  return {
    init: function () {
      this.handleCount();
    },
    handleCount: function () {
      const wishlist = document.querySelectorAll(".tps-header-wishlist");
      const items = JSON.parse(localStorage.getItem("tps__wishlist-items"));
      wishlist.forEach((item) => {
        const numb = item.querySelector(".wishlist-count");
        numb.innerText = items !== null && items.length != 0 ? items.length : 0;
      });
    },
  };
})();
var TpsWishlistLoad = (function () {
  return {
    init: function (productHandle, wishlist_items) {
      const is_page_wishlist = document.querySelector(
        ".tps__wishlist-page-section"
      );
      if (productHandle) {
        const arr_items = [];
        if (wishlist_items === null) {
          arr_items.push(productHandle);
          localStorage.setItem(
            "tps__wishlist-items",
            JSON.stringify(arr_items)
          );
        } else {
          let index = wishlist_items.indexOf(productHandle);
          arr_items.push(...wishlist_items);
          if (index === -1) {
            arr_items.push(productHandle);
            localStorage.setItem(
              "tps__wishlist-items",
              JSON.stringify(arr_items)
            );
          } else if (index > -1) {
            arr_items.splice(index, 1);
            localStorage.setItem(
              "tps__wishlist-items",
              JSON.stringify(arr_items)
            );
            if (is_page_wishlist) {
              const div_no_product = is_page_wishlist.querySelector(
                ".tps__wishlist-no-product-js"
              );
              const item_remove = document.querySelector(
                '.tps__wishlist-list[data-product-handle="' +
                productHandle +
                '"]'
              );
              if (item_remove) {
                item_remove.remove();
              }
              if (wishlist_items.length <= 1) {
                div_no_product.classList.remove("d-none");
              }
            }
          }
        }
        TpsSubActionProduct.handleInitWishlist();
      }
    },
  };
})();

var TpsCompareLoad = (function () {
  return {
    init: function (productTarget, compare_items) {
      const is_page_compare = document.querySelector(
        ".tps__compare-page-section"
      );
      if (productTarget) {
        const productHandle = productTarget.dataset.productHandle;
        const arr_items = [];
        if (compare_items === null) {
          arr_items.push(productHandle);
          localStorage.setItem("tps__compare-items", JSON.stringify(arr_items));
        } else {
          let index = compare_items.indexOf(productHandle);
          arr_items.push(...compare_items);
          if (index === -1) {
            arr_items.push(productHandle);
            localStorage.setItem(
              "tps__compare-items",
              JSON.stringify(arr_items)
            );
          } else if (index > -1) {
            arr_items.splice(index, 1);
            localStorage.setItem(
              "tps__compare-items",
              JSON.stringify(arr_items)
            );
            if (is_page_compare) {
              const div_no_product = is_page_compare.querySelector(
                ".tps__compare-no-product-js"
              );
              const item_remove = document.querySelectorAll(
                '.tps__compare-value[data-product-handle="' +
                productHandle +
                '"]'
              );
              if (item_remove.length !== 0) {
                item_remove.forEach((i) => {
                  i.remove();
                });
              }

              if (compare_items.length <= 1) {
                div_no_product.classList.remove("d-none");
                const attr_remove = document.querySelector(
                  ".tps__compare-table"
                );
                if (attr_remove) {
                  attr_remove.classList.add("d-none");
                }
              }
            }
          }
        }
        TpsSubActionProduct.handleInitCompare();
      }
    },
  };
})();

var TpsSubActionProduct = (function () {
  return {
    init: function () {
      this.handleInitQuickviewAction();
      this.handleActionWishlist();
      this.handleInitWishlist();
      this.handleActionCompare();
      this.handleInitCompare();
    },

    handleInitQuickviewAction: function () {
      const _this = this;
      const qvbtn = document.querySelectorAll(".tps__product-quickview");
      if (qvbtn.length > 0) {
        qvbtn.forEach((e) => {
          e.addEventListener("click", () => {
            e.classList.add("btn-loading");
            const exist_load = e.querySelectorAll("span.loader-icon");

            if (exist_load.length === 0) {
              const exist_loading = e.querySelectorAll("div.loader-icon");
              if (exist_loading.length === 0) {
                const spanLoading = document.createElement("div");
                spanLoading.classList.add("loader-icon");
                e.appendChild(spanLoading);
              }
            }
            const productTarget = e.closest(".tps__product-item");
            _this.handleFetchDataQuickView(
              e,
              productTarget.dataset.productHandle
            );
          });
        });
      }
    },

    handleFetchDataQuickView: function (e, handle) {
      const _this = this;
      if (handle) {
        var quickviewBox = document.querySelector(".tp-product-modal");
        quickviewBox.innerHTML = "";
        quickviewBox.classList.add("loading");
        var productAjaxURL =
          "/products/" + handle + "/?section_id=product-quickview";
        fetch(productAjaxURL)
          .then((response) => response.text())
          .then((responseText) => {
            const html = parser.parseFromString(responseText, "text/html");
            html
              .querySelectorAll("#shopify-section-product-quickview")
              .forEach((el) => {
                quickviewBox.innerHTML = el.innerHTML;
                quickviewBox.classList.remove("loading");
                TpsReloadSpr.init();
                Shopify.PaymentButton.init();
              });
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            _this.handleActionWishlist();
            _this.handleInitWishlist();
            _this.handleActionCompare();
            _this.handleInitCompare();
            e.classList.remove("btn-loading");
            e.querySelectorAll(".loader-icon").forEach((el) => {
              el.remove();
            });
          });
      }
    },

    handleInitWishlist: function () {
      const wishlist_items = JSON.parse(
        localStorage.getItem("tps__wishlist-items")
      );
      const wishlist_icon = document.querySelectorAll(
        ".tp-product-details-action-sm-btn-wishlist"
      );
      wishlist_icon.forEach((e) => {
        const { proAddWishlist, proRemoveWishlist } = e?.dataset;
        const is_page_wishlist = document.querySelector(
          ".tps__wishlist-page-section"
        );
        const tooltip_wishlist = e.querySelector(".tp-product-tooltip")
          ? e.querySelector(".tp-product-tooltip")
          : e.querySelector(".wishlist-tooltip-content");
        const productHandle = e.dataset.productHandle;

        if (wishlist_items !== null) {
          let index = wishlist_items.indexOf(productHandle);
          if (index !== -1) {
            e.classList.add("active");
            if (is_page_wishlist) {
              tooltip_wishlist.innerText =
                window.stringsTemplate.messageRemoveWishlist;
            } else {
              tooltip_wishlist.innerText = proRemoveWishlist;
            }
          } else {
            e.classList.remove("active");
            tooltip_wishlist.innerText = proAddWishlist;
          }
        }
        TpsWishlistHeader.init();
      });
    },

    handleActionWishlist: function () {
      const btnWishlist = document.querySelectorAll(
        ".tps__product-wishlist-js"
      );
      if (btnWishlist.length > 0) {
        btnWishlist.forEach((e) => {
          e.addEventListener("click", this.handleWishlistFunctionClick);
        });
      }
    },

    handleWishlistFunctionClick: function (evt) {
      const e = evt.currentTarget;
      const wishlist_items = JSON.parse(
        localStorage.getItem("tps__wishlist-items")
      );
      const productHandle = e.dataset.productHandle;
      const is_page_wishlist = document.querySelector(
        ".tps__wishlist-page-section"
      );
      if (is_page_wishlist) {
        TpsWishlistLoad.init(productHandle, wishlist_items);
      }
      const arr_items = [];
      if (wishlist_items === null) {
        arr_items.push(productHandle);
        localStorage.setItem("tps__wishlist-items", JSON.stringify(arr_items));
        TpsSubActionProduct.handleInitWishlist();
      } else {
        let index = wishlist_items.indexOf(productHandle);
        arr_items.push(...wishlist_items);
        if (index === -1) {
          arr_items.push(productHandle);
          localStorage.setItem(
            "tps__wishlist-items",
            JSON.stringify(arr_items)
          );
          TpsSubActionProduct.handleInitWishlist();
        } else if (index > -1) {
          if (is_page_wishlist) {
            arr_items.splice(index, 1);
            localStorage.setItem(
              "tps__wishlist-items",
              JSON.stringify(arr_items)
            );
          } else {
            window.location.href = `${window.shopUrl}/pages/wishlist`;
          }
        }
      }
    },

    handleCompareFunctionClick: function (evt) {
      const e = evt.currentTarget;
      const compare_items = JSON.parse(
        localStorage.getItem("tps__compare-items")
      );
      const productHandle = e.dataset.productHandle;
      const arr_items = [];
      if (compare_items === null) {
        arr_items.push(productHandle);
        localStorage.setItem("tps__compare-items", JSON.stringify(arr_items));
        TpsSubActionProduct.handleInitCompare();
      } else {
        let index = compare_items.indexOf(productHandle);
        arr_items.push(...compare_items);
        if (index === -1) {
          arr_items.push(productHandle);
          localStorage.setItem("tps__compare-items", JSON.stringify(arr_items));
          TpsSubActionProduct.handleInitCompare();
        } else if (index > -1) {
          window.location.href = `${window.shopUrl}/pages/compare`;
        }
      }
    },

    handleInitCompare: function () {
      const compare_items = JSON.parse(
        localStorage.getItem("tps__compare-items")
      );
      const compare_icon = document.querySelectorAll(
        ".tp-product-details-action-sm-btn-compare"
      );
      const is_page_compare = document.querySelector(
        ".tps__compare-page-section"
      );
      compare_icon.forEach((e) => {
        const { proAddCompare, proRemoveCompare } = e?.dataset;
        const tooltip_compare = e.querySelector(".tp-product-tooltip")
          ? e.querySelector(".tp-product-tooltip")
          : e.querySelector(".compare-tooltip-content");
        const productHandle = e.dataset.productHandle;
        if (compare_items !== null) {
          let index = compare_items.indexOf(productHandle);
          if (index !== -1) {
            e.classList.add("active");
            tooltip_compare.innerText =
              window.stringsTemplate.messageRemoveCompare;
            if (is_page_compare) {
            } else {
              tooltip_compare.innerText = proRemoveCompare;
            }
          } else {
            e.classList.remove("active");
            tooltip_compare.innerText = proAddCompare;
          }
        }
      });
    },

    handleActionCompare: function () {
      const btnCompare = document.querySelectorAll(
        ".tp-product-details-action-sm-btn-compare-js"
      );
      if (btnCompare.length > 0) {
        btnCompare.forEach((e) => {
          e.addEventListener("click", this.handleCompareFunctionClick);
        });
      }
    },
  };
})();
TpsSubActionProduct.init();
TpsWishlistHeader.init();
var TpsSubActionProductPreLoad = (function () {
  return {
    handleActionPg: function () {
      const btnRemoveCompare = document.querySelectorAll(
        ".tps__compare-remove-js"
      );
      if (btnRemoveCompare.length > 0) {
        btnRemoveCompare.forEach((e) => {
          e.addEventListener("click", function () {
            const compare_items = JSON.parse(
              localStorage.getItem("tps__compare-items")
            );
            const productTarget = e.closest(".tps__product-item");
            if (productTarget) {
              TpsCompareLoad.init(productTarget, compare_items);
            }
          });
        });
      }
    },
  };
})();
