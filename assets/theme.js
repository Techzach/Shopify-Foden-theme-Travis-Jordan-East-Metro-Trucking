
("use strict");
const global = {
  announcementBar: "announcement-bar",
  overlay: ".tps__overlay",
  header: "header",
  mobile_stickybar: "shopify-section-mobile-stickybar",
};

var TpsReloadSpr = (function () {
  return {
    init: function () {
      if (window.SPR) {
        window.SPR.registerCallbacks();
        window.SPR.initRatingHandler();
        window.SPR.initDomEls();
        window.SPR.loadProducts();
        window.SPR.loadBadges();
      }
    },
  };
})();

var TpsLazyloadImg = (function () {
  return {
    init: function () {
      this.lazyReady();
    },
    lazyReady: function () {
      if (!!window.IntersectionObserver) {
        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.width = entry.boundingClientRect.width;
                entry.target.height = entry.boundingClientRect.height;
                entry.target.sizes = `${entry.boundingClientRect.width}px`;
                entry.target.classList.add("tps-loaded-image");
                entry.target
                  .closest(".tps-image-js")
                  .classList.remove("tps-loading-image");
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "10px" }
        );
        document.querySelectorAll(".tps-image-js img").forEach((img) => {
          observer.observe(img);
        });
      }
    },
  };
})();
TpsLazyloadImg.init();

var TpsColorSwatchesShopify = (function () {
  return {
    init: function () {
      this.initSwatches();
    },

    initSwatches: function () {
      const _this = this;
      const actionSwatchColor = document.querySelectorAll(
        ".tps__product-color-swatches"
      );
      actionSwatchColor.forEach((e) => {
        _this.checkSwatches(e);
      });
      const actionSwatch = document.querySelectorAll(".tps__option-swatch-js");
      actionSwatch.forEach((e) => {
        const productTarget = e.closest(".tps__product-item");
        if (productTarget) {
          e.addEventListener("mouseover", () => {
            _this.listenerColor(e, productTarget);
            if (e.closest(".swiper")) {
              e.closest(".swiper").classList.add("show-tooltip");
            }
          });
          e.addEventListener(
            "mouseout",
            function () {
              if (e.closest(".swiper")) {
                e.closest(".swiper").classList.remove("show-tooltip");
              }
            },
            false
          );
        }
      });
    },

    listenerColor: function (e, productTarget) {
      const _this = this;
      setTimeout(() => {
        if (!e.classList.contains("active")) {
          const activeSwatches = e
            .closest(".tps__product-option")
            .querySelectorAll(".tps__option-swatch-js");
          activeSwatches.forEach((el) => {
            el.classList.remove("active");
          });
          e.classList.toggle("active");
          _this.swapProduct(productTarget);
        }
      }, 0);
    },

    updateMasterId(options, variantData) {
      var result = variantData.find((variant) => {
        return !variant.options
          .map((option, index) => {
            return options[index] === option;
          })
          .includes(false);
      });
      return result;
    },

    updatePrice(currentVariant, productTarget) {
      if (!currentVariant) return;
      const compare_at_price = currentVariant.compare_at_price;
      const price = currentVariant.price;
      const unit_price = currentVariant.unit_price;
      const unit_price_measurement = currentVariant.unit_price_measurement;
      const price_format = Shopify.formatMoney(
        currentVariant.price,
        cartStrings.money_format
      );
      if (unit_price && unit_price_measurement) {
        const price_num = Shopify.formatMoney(
          unit_price,
          cartStrings.money_format
        );
        const price_unit =
          unit_price_measurement.reference_value != 1
            ? unit_price_measurement.reference_value
            : unit_price_measurement.reference_unit;
        const upn = productTarget.querySelector(".unit-price .number");
        const upu = productTarget.querySelector(".unit-price .unit");
        if (upn) {
          upn.innerHTML = price_num;
        }
        if (upu) {
          upu.innerHTML = price_unit;
        }
      }
      const prp = productTarget.querySelector(".price__regular .price");
      if (prp) {
        prp.innerHTML = price_format;
      }
      const tps__price = productTarget.querySelector(".tps__price");
      tps__price.classList.remove("price--sold-out", "price--on-sale");
      tps__price
        .querySelector(".price__regular .price")
        .classList.remove("special-price");
      if (compare_at_price && compare_at_price > price) {
        const compare_format = Shopify.formatMoney(
          compare_at_price,
          cartStrings.money_format
        );
        if (!tps__price.querySelector(".compare-price")) {
          var ps = tps__price.querySelector(".price__sale");
          var sp = document.createElement("span");
          var cp = document.createElement("s");
          cp.classList.add("price-item", "compare-price");
          sp.appendChild(cp);
          if (ps) {
            ps.appendChild(sp);
          }
        }
        if (tps__price.querySelector(".compare-price")) {
          tps__price.querySelector(".compare-price").innerHTML = compare_format;
        }
        tps__price.classList.add("price--on-sale");
        tps__price
          .querySelector(".price__regular .price")
          .classList.add("special-price");
      } else if (!currentVariant.available) {
        tps__price.classList.add("price--sold-out");
      }
    },

    updateMedia(currentVariant, productTarget) {
      if (!currentVariant) return;
      if (!currentVariant.featured_media) return;
      setTimeout(() => {
        productTarget
          .querySelector(".tps__product-main-img img")
          .removeAttribute("srcset");
        productTarget
          .querySelector(".tps__product-main-img img")
          .setAttribute("src", currentVariant.featured_media.preview_image.src);
      }, 200);
    },

    renderProductInfo(currentVariant, variantQtyData, productTarget, color) {
      let qty = 0;
      let percent = 0;
      let sale = false;
      let sold_out = false;
      let pre_order = false;
      let av = false;
      let im = false;
      const compare_at_price = currentVariant.compare_at_price;
      const price = currentVariant.price;
      const vqd = variantQtyData.reduce((acc, item) => {
        const existingItem = acc.find((i) => i.option === item.option);
        if (existingItem) {
          existingItem.qty += item.qty;
          if (item.available === true) {
            existingItem.available = true;
          }
          if (item.mamagement === "") {
            existingItem.mamagement = "";
          }
        } else {
          acc.push(item);
        }
        return acc;
      }, []);
      vqd.find((variantQty) => {
        if (variantQty.option === currentVariant.option1) {
          qty = variantQty.qty;
          av = variantQty.available;
          im = variantQty.mamagement;
        }
      });
      if (compare_at_price && compare_at_price > price) {
        sale = true;
        percent = ((compare_at_price - price) / compare_at_price) * 100;
      }
      if (im === "") {
        sold_out = false;
        pre_order = false;
      } else {
        if (av && qty < 1) {
          pre_order = true;
        } else if (!av) {
          sold_out = true;
        }
      }
      const product_label = productTarget.querySelector(".tps__product-label");
      if (product_label) {
        product_label.remove();
      }
      if (sale || pre_order || sold_out) {
        var element = document.createElement("div");
        element.classList.add(
          "tps__product-label",
          "fs-12",
          "pointer-events-none",
          "absolute"
        );
        productTarget.querySelector(".tps__product-img").appendChild(element);
        const label = productTarget.querySelector(".tps__product-label");

        if (sale) {
          if (label.querySelector(".tps__sale-label")) {
            label.querySelector(".tps__sale-label").innerText =
              -percent.toFixed(0) + "%";
          } else {
            var element_sale = document.createElement("div");
            element_sale.classList.add("tps__sale-label");
            element_sale.innerText = -percent.toFixed(0) + "%";
            if (label) {
              label.appendChild(element_sale);
            }
          }
        }
        if (sold_out) {
          if (label.querySelector(".tps__sold-out-label")) {
            label.querySelector(".tps__sold-out-label").innerText =
              window.variantStrings.soldOut;
          } else {
            var element_sold_out = document.createElement("div");
            element_sold_out.classList.add("tps__sold-out-label");
            element_sold_out.innerText = window.variantStrings.soldOut;
            if (label) {
              label.appendChild(element_sold_out);
            }
          }
        }
        if (pre_order) {
          var element_pre_order = document.createElement("div");
          element_pre_order.classList.add("tps__pre-order-label");
          element_pre_order.innerText = window.variantStrings.preOrder;
          if (label) {
            label.appendChild(element_pre_order);
          }
        }
      }

      const productAddCartDiv = productTarget.querySelector(
        ".tps__product-addtocart-js"
      );
      if (productAddCartDiv) {
        const currentVariantId = productAddCartDiv.dataset.productVariantId;
        if (Number(currentVariantId) !== currentVariant.id) {
          productAddCartDiv.dataset.productVariantId = currentVariant.id;
        }
      }
      this.toggleAddButton(
        !currentVariant.available,
        window.variantStrings.soldOut,
        productTarget,
        pre_order
      );
    },

    toggleAddButton(disable = true, text, productTarget, pre_order = false) {
      const productForm = productTarget;
      if (!productForm) return;
      const addButton = productForm.querySelector(".tps__js-addtocart");
      const addButtonText = productTarget.querySelector(
        ".tps__js-addtocart .tps__button-content"
      );
      const addButtonTooltipText = productTarget.querySelector(
        ".tps__js-addtocart .tps_tooltip-content"
      );
      if (!addButton) return;
      if (disable) {
        addButton.setAttribute("disabled", "disabled");
        if (text) {
          addButtonText.textContent = text;
          addButtonText.textContent = text;
        }
      } else {
        addButton.removeAttribute("disabled");
        if (pre_order) {
          addButtonText.textContent = window.variantStrings.preOrder;
          addButtonTooltipText.textContent = window.variantStrings.preOrder;
        } else {
          addButtonText.textContent = window.variantStrings.addToCart;
          addButtonTooltipText.textContent = window.variantStrings.addToCart;
        }
      }
    },

    setUnavailable(productTarget) {
      const addButton = productTarget.querySelector(".tps__js-addtocart");
      const addButtonText = productTarget.querySelector(
        ".tps__js-addtocart .tps__button-content"
      );
      const addButtonTooltipText = productTarget.querySelector(
        ".tps__js-addtocart .tps_tooltip-content"
      );
      if (!addButton) return;
      addButtonText.textContent = window.variantStrings.unavailable;
      addButtonTooltipText.textContent = window.variantStrings.unavailable;
    },

    swapProduct: function (productTarget) {
      const product_swatch_active = productTarget.querySelector(
        ".tps__option-swatch-js.active"
      );
      const position_swatch =
        product_swatch_active.getAttribute("data-position");
      const variantData = JSON.parse(
        productTarget.querySelector(".productinfo").textContent
      );
      const variantQtyData = JSON.parse(
        productTarget.querySelector(".productVariantsQty").textContent
      );
      let options = Array.from(
        productTarget.querySelectorAll(".tps__option-swatch-js.active"),
        (select) => select.getAttribute("data-value")
      );
      variantData.find((variant) => {
        if (options.length == 1) {
          const variantOptions = {
            1: variant.option1,
            2: variant.option2,
            3: variant.option3,
          };
          if (variantOptions[position_swatch] === options[0]) {
            options = variant.options;
          }
        }
      });
      const currentVariant = this.updateMasterId(options, variantData);
      this.toggleAddButton(true, "", productTarget);
      if (!currentVariant) {
        this.toggleAddButton(true, "", productTarget);
        this.setUnavailable(productTarget);
      } else {
        this.updatePrice(currentVariant, productTarget);
        this.updateMedia(currentVariant, productTarget);
        this.renderProductInfo(
          currentVariant,
          variantQtyData,
          productTarget,
          product_swatch_active.dataset.color
        );
      }
    },

    checkSwatches: function (e) {
      const { color, image } = e?.dataset;
      if (this.checkColor(color)) {
        e.style.backgroundColor = color;
      } else {
        if (image) {
          e.classList.add = "tps__" + color.replace(" ", "-");
          e.style.backgroundColor = null;
          e.style.backgroundImage = "url('" + image + "')";
          e.style.backgroundSize = "cover";
          e.style.backgroundRepeat = "no-repeat";
        }
      }
    },

    checkColor: function (strColor) {
      var s = new Option().style;
      s.color = strColor;
      return s.color == strColor;
    },
  };
})();
TpsColorSwatchesShopify.init();

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function backToTop() {
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  if (document.getElementById("tps__back-top")) {
    document.getElementById("tps__back-top").style.height = scrolled + "%";
  }
}

function mobileStickyBar() {
  var stickybar = document.querySelector(".tps__mobile-stickybar");
  if (!stickybar) {
    return;
  }
  var currentScroll = window.pageYOffset;
  let headerbar = 0;
  if (document.getElementById("announcement-bar")) {
    headerbar = document.getElementById("announcement-bar").clientHeight;
  }
  let headertopbar = 0;
  if (document.getElementById("shopify-section-top-bar")) {
    headertopbar = document.getElementById(
      "shopify-section-top-bar"
    ).clientHeight;
  }
  let headerpage = document.getElementById("page-header").clientHeight;
  let headerh = headerbar + headertopbar + headerpage + 50;
  if (currentScroll > headerh) {
    stickybar.classList.remove("d-none");
  } else {
    stickybar.classList.add("d-none");
  }
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function initComparisons() {
  var x, i;
  x = document.getElementsByClassName("img-comp-overlay");
  for (i = 0; i < x.length; i++) {
    compareImages(x[i]);
  }
  function compareImages(img) {
    var slider,
      img,
      clicked = 0,
      w,
      h;
    w = img.offsetWidth;
    h = img.offsetHeight;
    const icc = img.closest(".img-comp-container");
    if (icc) {
      slider = icc.querySelector(".image-comparison__button");
    }
    if (slider) {
      slider.addEventListener("touchstart", slideReady);
      slider.addEventListener("mousedown", slideReady);
    }
    window.addEventListener("mouseup", slideFinish);
    window.addEventListener("touchend", slideFinish);
    function slideReady(e) {
      e.preventDefault();
      clicked = 1;
      window.addEventListener("mousemove", slideMove);
      window.addEventListener("touchmove", slideMove);
    }
    function slideFinish() {
      clicked = 0;
    }
    function slideMove(e) {
      var pos;
      if (clicked == 0) return false;
      pos = getCursorPos(e);
      if (pos < 0) pos = 0;
      if (pos > w) pos = w;
      slide(pos);
    }
    function getCursorPos(e) {
      var a,
        x = 0;
      e = e.changedTouches ? e.changedTouches[0] : e;
      a = img.getBoundingClientRect();
      x = e.pageX - a.left;
      x = x - window.pageXOffset;

      return x;
    }
    function slide(x) {
      if (slider) {
        var x_ps = x + slider.offsetWidth / 2 + 10;
        var percent = (x_ps / w) * 100;
        if (percent >= 100 - ((slider.offsetWidth / 2 + 10) / w) * 100) {
          percent = 100 - ((slider.offsetWidth / 2 + 10) / w) * 100;
        }
      }

      img
        .closest(".img-comp-container")
        .setAttribute(
          "style",
          "--percent: " + percent.toFixed(4) + "%;--height: " + h + "px "
        );
    }
  }
}
initComparisons();

const slideAnime = (setOptions) => {
  "use strict";
  const defaultOptions = {
    target: false,
    animeType: "slideToggle",
    duration: 400,
    easing: "ease",
    isDisplayStyle: "block",
  };
  const options = Object.assign({}, defaultOptions, setOptions);
  const target = options.target;

  if (!target) {
    return;
  }

  let animeType = options.animeType;
  const styles = getComputedStyle(target);
  if (animeType === "slideToggle") {
    animeType = styles.display === "none" ? "slideDown" : "slideUp";
  }
  if (
    (animeType === "slideUp" && styles.display === "none") ||
    (animeType === "slideDown" && styles.display !== "none") ||
    (animeType !== "slideUp" && animeType !== "slideDown")
  ) {
    return false;
  }
  target.style.overflow = "hidden";
  const duration = options.duration;
  const easing = options.easing;
  const isDisplayStyle = options.isDisplayStyle;

  if (animeType === "slideDown") {
    target.style.display = isDisplayStyle;
  }
  const heightVal = {
    height: target.getBoundingClientRect().height + "px",
    marginTop: styles.marginTop,
    marginBottom: styles.marginBottom,
    paddingTop: styles.paddingTop,
    paddingBottom: styles.paddingBottom,
  };

  Object.keys(heightVal).forEach((key) => {
    if (parseFloat(heightVal[key]) === 0) {
      delete heightVal[key];
    }
  });
  if (Object.keys(heightVal).length === 0) {
    return false;
  }
  let slideAnime;
  if (animeType === "slideDown") {
    Object.keys(heightVal).forEach((key) => {
      target.style[key] = 0;
    });
    slideAnime = target.animate(heightVal, {
      duration: duration,
      easing: easing,
    });
  } else if (animeType === "slideUp") {
    Object.keys(heightVal).forEach((key) => {
      target.style[key] = heightVal[key];
      heightVal[key] = 0;
    });
    slideAnime = target.animate(heightVal, {
      duration: duration,
      easing: easing,
    });
  }
  slideAnime.finished.then(() => {
    target.style.overflow = "";
    Object.keys(heightVal).forEach((key) => {
      target.style[key] = "";
    });
    if (animeType === "slideUp") {
      target.style.display = "none";
    }
  });
};

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }
  return formatString.replace(placeholderRegex, value);
};

Shopify.eventFlashSold = function (dlg = false) {
  let element = document.querySelector(
    ".tps__product-details-infor .tps__flash-sold"
  );
  if (dlg) {
    element = document.querySelector(
      ".tps__quickview-content .tps__flash-sold"
    );
  }
  if (!element) return;
  const flash_sold = element.getAttribute("data-flash-sold");
  const flash_hours = element.getAttribute("data-flash-hours");
  const soldArray = flash_sold.split(",");
  const hoursArray = flash_hours.split(",");
  var sold = soldArray[Math.floor(Math.random() * soldArray.length)];
  var hour = hoursArray[Math.floor(Math.random() * hoursArray.length)];
  const ps = document.querySelector(".tps__flash-sold .product-sold");
  const ph = document.querySelector(".tps__flash-sold .product-hour");
  if (ps) {
    ps.innerHTML = sold;
  }
  if (ph) {
    ph.innerHTML = hour;
  }
  element.style.display = "block";
};

Shopify.eventFlashingBrowseTab = function () {
  var enable = window.flashingBrowseTab.enable,
    myTimer,
    message,
    titleTag = document.getElementsByTagName("title")[0],
    first_notification = window.flashingBrowseTab.firstNotification,
    secondary_notification = window.flashingBrowseTab.secondaryNotification;
  if (enable && titleTag) {
    var originalTitle = titleTag.innerText;
    var isActive = true;
    document.addEventListener("visibilitychange", () => {
      document.visibilityState === "visible"
        ? (function () {
            if (isActive) return;
            clearInterval(myTimer), (titleTag.innerText = originalTitle);
          })()
        : (function () {
            var i = 1;
            if (
              ((isActive = false),
              !first_notification || !secondary_notification)
            )
              return;
            myTimer = setInterval(function () {
              if (i == 1) {
                message = first_notification;
                i = 2;
              } else {
                message = secondary_notification;
                i = 1;
              }
              titleTag.innerText = message;
            }, 2000);
          })();
    });
  }
};

Shopify.addToastAction = function (strToast) {
  let messageToast = EasyDialogBox.create(
    null,
    "dlg-toast dlg-fade",
    null,
    strToast,
    null,
    null,
    20,
    500
  );
  messageToast.onHide = messageToast.destroy;
  messageToast.show().hide(3000);
};

Shopify.termsConditionsAction = function () {
  function conditions(evt) {
    const content = document.getElementById("popup-terms-conditions");
    const e = evt.currentTarget;
    if (!content) return;
    const text = content.getAttribute("data-text");
    var promotion = EasyDialogBox.create(
      "popup-terms-conditions",
      "dlg dlg-disable-footer dlg-disable-drag",
      text,
      content.innerHTML
    );
    promotion.onClose = promotion.destroy;
    promotion.show(300);
    e.href = "javascript: (function(){})();";
    e.target = "_self";
  }
  document.querySelectorAll(".tps__terms-conditions a").forEach((event) => {
    event.addEventListener("click", conditions);
  });
};

Shopify.eventCountDownTimer = function (dlg = false) {
  let element = document.querySelectorAll(".tps__countdown-timer");
  if (dlg) {
    element = document.querySelectorAll(
      ".tps__quickview-content .tps__countdown-timer"
    );
  }
  element.forEach((el) => {
    const day = el.getAttribute("data-days");
    const hrs = el.getAttribute("data-hrs");
    const secs = el.getAttribute("data-secs");
    const mins = el.getAttribute("data-mins");
    const time = el.getAttribute("data-time");
    var countDownDate = new Date(time).getTime();
    var timer = setInterval(function () {
      var now = new Date().getTime();
      var distance = countDownDate - now;
      if (distance < 0) {
        el.classList.add("d-none");
        clearInterval(timer);
      } else {
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);
        var html =
          '<span class="countdown-days"><span class="countdown_ti heading-weight">' +
          days +
          '</span> <span class="countdown_tx">' +
          day +
          "</span></span> " +
          '<span class="countdown-hours"><span class="countdown_ti heading-weight">' +
          hours +
          '</span> <span class="countdown_tx">' +
          hrs +
          "</span></span> " +
          '<span class="countdown-min"><span class="countdown_ti heading-weight">' +
          minutes +
          '</span> <span class="countdown_tx">' +
          mins +
          "</span></span> " +
          '<span class="countdown-sec"><span class="countdown_ti heading-weight">' +
          seconds +
          '</span> <span class="countdown_tx">' +
          secs +
          "</span></span>";
        const cd = el.querySelector(".tps__product-countdown");
        if (cd) {
          cd.innerHTML = html;
        }
        el.classList.remove("d-none");
      }
    }, 1000);
  });
};

Shopify.swiperSlideQickview = function () {
  var swiper_qickview = new Swiper("#tps__swiper-qickview", {
    slidesPerView: 1,
    spaceBetween: 0,
    autoplay: false,
    loop: true,
    navigation: {
      nextEl: document
        .getElementById("tps__swiper-qickview")
        .querySelector(".swiper-button-next"),
      prevEl: document
        .getElementById("tps__swiper-qickview")
        .querySelector(".swiper-button-prev"),
    },
  });

  document
    .querySelectorAll(".tps__quickview-content .tps__option-swatch")
    .forEach((button) => {
      button.addEventListener(
        "click",
        (e) => {
          const target = e.currentTarget;
          var options = Array.from(
            target
              .closest("#variant-radios")
              .querySelectorAll(".tps__option-swatch.active"),
            (select) => select.getAttribute("data-value")
          );
          var variantData = JSON.parse(
            target
              .closest("#variant-radios")
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
            .closest(".tps__product-quickview")
            .querySelector(`[data-media-id="${featured_media_id}"]`)
            .getAttribute("data-position");
          swiper_qickview.slideTo(position, 1000);
        },
        false
      );
    });

  var conditions = document.getElementById("conditions_form_qickview");
  if (conditions) {
    conditions.addEventListener("change", (event) => {
      const ccq = document.querySelector(".tps-btn-checkout-qickview");
      if (ccq) {
        if (event.currentTarget.checked) {
          ccq.classList.remove("disabled");
        } else {
          ccq.classList.add("disabled");
        }
      }
    });
  }
};

var TpsEventShopify = (function () {
  return {
    init: function () {
      this.setupEventListeners();
      Shopify.eventCountDownTimer();
      Shopify.eventFlashingBrowseTab();
    },
    setupEventListeners: function () {
      window.addEventListener("scroll", () => {
        backToTop();
        mobileStickyBar();
      });

      document
        .querySelectorAll(".collection-infinite-scroll a")
        .forEach((showMore) => {
          showMore.addEventListener(
            "click",
            (e) => {
              for (var item of document.querySelectorAll(
                ".collection-list__item.grid__item"
              )) {
                item.classList.remove("d-none");
              }
              showMore.parentElement.remove();
            },
            false
          );
        });

      const footer_block = document.querySelectorAll(
        ".tps__footer_block-title"
      );
      footer_block.forEach((footer) => {
        footer.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const parent = target.parentElement;
          const footerContent = parent.querySelector(
            ".tps__footer_block-content"
          );
          slideAnime({
            target: footerContent,
            animeType: "slideToggle",
          });
          const footer_block = target.closest(".tps__footer_block");
          if (!footer_block.classList.contains("active")) {
            footer_block.classList.add("active");
          } else {
            footer_block.classList.remove("active");
          }
        });
      });

      const mobile_stickybar = document.getElementById(global.mobile_stickybar);
      const ft = document.querySelector("footer");
      if (mobile_stickybar && ft) {
        ft.classList.add("enable_menu-bottom");
      }

      const cookie_bar = document.getElementById("tps_cookie");
      if (cookie_bar) {
        if (!getCookie("cookie_bar")) {
          cookie_bar.classList.remove("d-none");
        }
        document
          .querySelectorAll("#tps_cookie .cookie-dismiss")
          .forEach((closeCookie) => {
            closeCookie.addEventListener(
              "click",
              (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                target.closest("#tps_cookie").remove();
                setCookie("cookie_bar", "dismiss", 30);
              },
              false
            );
          });
      }

      const announcementBar = document.getElementById(global.announcementBar);
      if (announcementBar) {
        const swc = announcementBar.querySelector(".swiper-announcementBar");
        if (swc) {
          swc.style.maxHeight = announcementBar.offsetHeight + "px";
          var swiper = new Swiper(".swiper-announcementBar", {
            loop: true,
            slidesPerView: 1,
            direction: "vertical",
            autoplay: {
              delay: 3000,
            },
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            },
          });
        }
        const cds = announcementBar.querySelectorAll(
          ".countdown-announcementBar"
        );
        cds.forEach((cd) => {
          const cddl = cd?.dataset.blockDeadline;
          const dateParts = cddl.split("-");
          const isoDate =
            dateParts[2] +
            "-" +
            dateParts[0].padStart(2, "0") +
            "-" +
            dateParts[1].padStart(2, "0") +
            "T00:00:00Z";
          if (cddl && Date.parse(isoDate)) {
            const deadline = new Date(isoDate);
            const calculateTimeLeft = () => {
              const difference = +deadline - +new Date();
              let timeLeft = {};
              if (difference > 0) {
                timeLeft = {
                  days_announcementBar: Math.floor(
                    difference / (1000 * 60 * 60 * 24)
                  ),
                  hours_announcementBar: Math.floor(
                    (difference / (1000 * 60 * 60)) % 24
                  ),
                  minutes_announcementBar: Math.floor(
                    (difference / 1000 / 60) % 60
                  ),
                  seconds_announcementBar: Math.floor((difference / 1000) % 60),
                };
              }
              return timeLeft;
            };
            const updateCountdown = () => {
              const timeLeft = calculateTimeLeft();
              Object.entries(timeLeft).forEach(([key, value]) => {
                cd.querySelector("." + key).innerHTML = value;
              });
            };

            setInterval(updateCountdown, 1000);
          }
        });
        if (getCookie("announcement_bar")) {
          announcementBar.classList.add("d-none");
        }
        document
          .querySelectorAll("#announcement-bar .announcement-close")
          .forEach((closeAnnouncement) => {
            closeAnnouncement.addEventListener(
              "click",
              (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                target.closest("#announcement-bar").remove();
                setCookie("announcement_bar", 1, 1);
              },
              false
            );
          });
      }
      const conditions = document.getElementById("product_conditions_form");
      if (conditions) {
        conditions.addEventListener("change", (event) => {
          const bpb = document.querySelector(".tps__payment-button");
          if (bpb) {
            if (event.currentTarget.checked) {
              bpb.classList.remove("disabled");
            } else {
              bpb.classList.add("disabled");
            }
          }
        });
      }

      document.querySelectorAll(global.overlay).forEach((event) => {
        event.addEventListener(
          "click",
          (e) => {
            const target = e.currentTarget;
            target.classList.add("d-none-overlay");
            document.documentElement.classList.remove("hside_opened");
            document.documentElement.classList.remove("vetical-overlay");
            for (var item of document.querySelectorAll(".tps__opend-popup")) {
              item.classList.remove("tps__opend-popup");
            }
            const btn = document.querySelector(".btn-filter");
            if (btn && btn.classList.contains("actived")) {
              btn.classList.remove("actived");
            }
            for (var item of document.querySelectorAll(".tps__addon")) {
              item.classList.remove("is-open");
            }
            for (var item of document.querySelectorAll(
              ".tps-minicart-wrapper"
            )) {
              item.classList.remove("addons-open");
            }
            for (var item of document.querySelectorAll(".vertical-menu")) {
              item.classList.remove("open");
            }
          },
          false
        );
      });

      document.querySelectorAll(".tps__terms-conditions a").forEach((event) => {
        event.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const content = document.getElementById("popup-terms-conditions");
            if (!content) return;
            const text = content.getAttribute("data-text");
            var promotion = EasyDialogBox.create(
              "popup-terms-conditions",
              "dlg dlg-disable-footer dlg-disable-drag",
              text,
              content.innerHTML
            );
            promotion.onClose = promotion.destroy;
            promotion.show(300);
          },
          false
        );
      });
    },
  };
})();
TpsEventShopify.init();

let newParser = new DOMParser();
var TpsSettingsSwiper = (function () {
  return {
    init: function () {
      this.TpsSettingsCarousel();
    },
    TpsSettingsCarousel: function () {
      document.querySelectorAll(".tps__swiper").forEach((element) => {
        this.TpsCarousel(element);
      });
    },
    TpsCarousel: function (e) {
      var autoplaying = e?.dataset.autoplay === "true";
      var loop = e.dataset.loop === "true";
      var dataSlideshow = e?.dataset.slideshow ? e?.dataset.slideshow : 0;
      var itemDesktop = e?.dataset.desktop ? e?.dataset.desktop : 4;
      var itemTablet = e?.dataset.tablet ? e?.dataset.tablet : 2;
      var itemMobile = e?.dataset.mobile ? e?.dataset.mobile : 1;
      var autoplaySpeed = e?.dataset.autoplaySpeed
        ? e?.dataset.autoplaySpeed
        : 3000;
      var speed = e?.dataset.speed ? e?.dataset.speed : 400;
      var effect = e?.dataset.effect ? e?.dataset.effect : "slide";
      var sectionId = e?.dataset.sectionId;
      var row = e?.dataset.row ? e?.dataset.row : 1;
      var width = window.innerWidth;
      var spacing = e?.dataset.spacing ? e?.dataset.spacing : 0;
      spacing = Number(spacing);
      autoplaySpeed = Number(autoplaySpeed);
      speed = Number(speed);
      if (width <= 767) {
        if (spacing >= 15) {
          spacing = 15;
        }
      } else if (width <= 1199) {
        if (spacing >= 30) {
          spacing = 30;
        }
      }
      new Swiper("#tps__swiper-" + sectionId, {
        slidesPerView: itemMobile,
        spaceBetween: spacing,
        autoplay: autoplaying,
        delay: autoplaySpeed,
        loop: loop,
        effect: effect,
        speed: speed,
        watchSlidesProgress: true,
        watchSlidesVisibility: true,
        grid: {
          rows: row,
          fill: "row",
        },
        navigation: {
          nextEl: e.querySelector(".swiper-button-next"),
          prevEl: e.querySelector(".swiper-button-prev"),
        },
        pagination: {
          clickable: true,
          el: e.querySelector(".swiper-pagination"),
        },
        breakpoints: {
          768: {
            slidesPerView: itemTablet,
          },
          1200: {
            slidesPerView: itemDesktop,
          },
        },
        on: {
          init: function () {
            if (dataSlideshow) {
              if (width <= 767) {
                e.querySelectorAll(".slide-image-mobile").forEach(
                  (imgMobile) => {
                    var dataImageSlideMobile =
                      imgMobile?.dataset.imgSlideMobile;
                    imgMobile.innerHTML = `<img 
                      src=${dataImageSlideMobile} 
                      alt="slide mobile" 
                      srcset="${dataImageSlideMobile}&amp;width=375 375w, ${dataImageSlideMobile}&amp;width=550 550w, ${dataImageSlideMobile}&amp;width=750 750w, ${dataImageSlideMobile}&amp;width=1100 1100w, ${dataImageSlideMobile}&amp;width=1500 1500w, ${dataImageSlideMobile}&amp;width=1780 1780w, ${dataImageSlideMobile}&amp;width=2000 2000w, ${dataImageSlideMobile}&amp;width=3000 3000w, ${dataImageSlideMobile}&amp;width=3840 3840w" 
                      sizes="100vw"
                    >`;
                  }
                );
              } else {
                e.querySelectorAll(".slide-image").forEach((img) => {
                  var dataImageSlide = img?.dataset.imgSlide;
                  img.innerHTML = `<img 
                      src=${dataImageSlide} 
                      alt="slide" 
                      srcset="${dataImageSlide}&amp;width=375 375w, ${dataImageSlide}&amp;width=550 550w, ${dataImageSlide}&amp;width=750 750w, ${dataImageSlide}&amp;width=1100 1100w, ${dataImageSlide}&amp;width=1500 1500w, ${dataImageSlide}&amp;width=1780 1780w, ${dataImageSlide}&amp;width=2000 2000w, ${dataImageSlide}&amp;width=3000 3000w, ${dataImageSlide}&amp;width=3840 3840w" 
                      sizes="100vw"
                    >`;
                });
              }
            }
          },
        },
      });
    },
  };
})();
TpsSettingsSwiper.init();

document.addEventListener("shopify:section:load", function (event) {
  var id = event.detail.sectionId;
  var section = event.target.querySelector("[" + "data-id" + '="' + id + '"]');
  if (section) {
    var element = section.querySelector(".tps__swiper");
    if (element) {
      TpsSettingsSwiper.TpsCarousel(element);
    }
  }
  if (id) {
    TpsLazyloadImg.init();
  }
});

var TpsToggle = (function () {
  return {
    init: function () {
      this.initToggle(), this.backToTop(), this.initToggleLookbook();
    },
    initToggle: function () {
      var faq_parent = ".tps__page-faq-items > .tps__page-faq-title";
      document.querySelectorAll(faq_parent).forEach((item) => {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const target = e.currentTarget;
          const parent = target.parentElement;
          const faqContent = parent.querySelector(".tps__page-faq-content");
          slideAnime({
            target: faqContent,
            animeType: "slideToggle",
          });
          if (item.closest(".tps-toggle").classList.contains("active")) {
            item.closest(".tps-toggle").classList.remove("active");
          } else {
            item.closest(".tps-toggle").classList.add("active");
          }
        });
      });
    },
    backToTop: function () {
      const b = document.querySelector(".back-top");
      if (b) {
        document.addEventListener("scroll", () => {
          if (window.scrollY > 400) {
            b.classList.add("show");
          } else {
            b.classList.remove("show");
          }
        });
        b.addEventListener("click", () => {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        });
      }
    },
    initToggleLookbook: function () {
      document.body.addEventListener("click", (evt) => {
        const target = evt.target;
        if (
          !target.closest(".tps__product-item") &&
          target !=
            document.querySelector(
              ".tps__product-item.active .lookbook__popup-items"
            )
        ) {
          const lookbook_items =
            document.querySelectorAll(".tps__product-item");
          lookbook_items.forEach((items) => {
            items.classList.remove(
              "active",
              "top",
              "bottom",
              "left",
              "right",
              "center"
            );
          });
        }
      });
      document.body.addEventListener("click", this.onBodyClick);
      const lookbook = document.querySelectorAll(".lookbook-action");
      lookbook.forEach((action) => {
        action.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const item = target.closest(".tps__product-item");
          const lookbook_item = item.querySelector(".lookbook__popup-items");
          const rect = item.getBoundingClientRect();
          const rect_item = lookbook_item.getBoundingClientRect();
          const item_right = rect_item.right;
          const item_left = rect_item.left;
          let height = window.innerHeight;
          let width = window.innerWidth;
          let pos_l = "center";
          const top = rect.top;
          const lookbook_items =
            document.querySelectorAll(".tps__product-item");
          if (!item.classList.contains("active")) {
            lookbook_items.forEach((items) => {
              items.classList.remove(
                "active",
                "top",
                "bottom",
                "left",
                "right",
                "center"
              );
            });
            item.classList.add("active");
            if (width > 767) {
              if (item_right > width) {
                pos_l = "left";
              } else if (item_left < 0) {
                pos_l = "right";
              }
              if (top > height / 2) {
                item.classList.add("top", pos_l);
              } else {
                item.classList.add("bottom", pos_l);
              }
            } else {
              if (top > height / 2) {
                item.classList.add("top");
              } else {
                item.classList.add("bottom");
              }
              let left = 0;
              if (item_right > width) {
                left = -50 - (item_right - width);
                lookbook_item.style.left = left + "px";
              } else if (item_left < 0) {
                left = -item_left;
                lookbook_item.style.left = left + "px";
              }
            }
          } else {
            item.classList.remove(
              "active",
              "top",
              "bottom",
              "left",
              "right",
              "center"
            );
          }
        });
      });
    },
  };
})();
TpsToggle.init();

var TpsPopup = (function () {
  return {
    init: function () {
      this.fetchDataNewletter(),
        this.fetchDataPromotion(),
        this.checkFormInfo(),
        this.checkShowMsgStockNotify();
    },
    setCookie: function (cname, exdays, cvalue) {
      const date = new Date();
      date.setTime(date.getTime() + exdays * 24 * 60 * 60 * 1000);
      let expires = "expires=" + date.toUTCString();
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    },
    getCookie: function (cname) {
      let name = cname + "=";
      let ca = document.cookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    },
    deleteCookie: function (cname) {
      document.cookie = cname + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    },
    fetchDataNewletter: function () {
      const url = `${window.location.pathname}?section_id=newsletter-popup`;
      const _this = this;
      if (popup.newsletterPopup !== false) {
        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = newParser.parseFromString(responseText, "text/html");
            const n = html.querySelector("#tps__newsletter-popup");
            if (n) {
              const c = n?.dataset.show;
              const disableMobile = n?.dataset.showMobile === "true";
              if (c === "show-on-all-pages" || c === "show-on-homepage") {
                if (_this.getCookie("tps-newsletter-popup") === "") {
                  var newsletter = EasyDialogBox.create(
                    "newsletterp",
                    `dlg dlg-disable-footer	dlg-disable-drag ${
                      disableMobile ? "dlg-disable-mobile" : ""
                    }`,
                    "",
                    n.innerHTML
                  );
                  newsletter.onClose = newsletter.destroy;
                  newsletter.show(1000);
                  newsletter.onShow = function () {
                    _this.checkNotShowNewletter();
                  };
                }
              }
            }
          })
          .catch((e) => {
            throw e;
          });
      }
    },
    checkNotShowNewletter: function () {
      const _this = this;
      const check = document.getElementById("doNotShow");
      if (check) {
        check.addEventListener("change", (e) => {
          if (e.currentTarget.checked) {
            _this.setCookie("tps-newsletter-popup", 99999, "tps");
          } else {
            _this.deleteCookie("tps-newsletter-popup");
          }
        });
      }
    },
    fetchDataPromotion: function () {
      const url = "?section_id=promotion-popup";
      const _this = this;
      if (popup.promotionPopup !== false) {
        fetch(`${window.Shopify.routes.root}${url}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = newParser.parseFromString(responseText, "text/html");
            const p = html.querySelector("#tps__promotion-popup");
            const s = p?.dataset.show === "true";
            const m = p?.dataset.showMb === "true";
            if (s === true) {
              if (_this.getCookie("tps-promotion-popup") === "") {
                var promotion = EasyDialogBox.create(
                  "promotionp",
                  `dlg dlg-disable-footer ${
                    m ? "" : "dlg-disable-mobile"
                  } dlg-disable-drag`,
                  "",
                  p.innerHTML
                );
                promotion.onClose = promotion.destroy;
                promotion.show(6000);
                promotion.onShow = function () {
                  _this.copyPromotion();
                  _this.checkNotShowPromotion();
                };
              }
            }
          })
          .catch((e) => {
            throw e;
          });
      }
    },
    checkNotShowPromotion: function () {
      const _this = this;
      const check = document.querySelector("#doNotShowPromotion");
      if (check) {
        check.addEventListener("change", (e) => {
          if (e.currentTarget.checked) {
            _this.setCookie("tps-promotion-popup", 99999, "tps");
          } else {
            _this.deleteCookie("tps-promotion-popup");
          }
        });
      }
    },
    copyPromotion: function () {
      const cp = document.querySelectorAll(".discount");
      if (cp !== null) {
        cp.forEach((e) => {
          e.addEventListener("click", (el) => {
            el.preventDefault();
            navigator.clipboard.writeText(e?.dataset.code);
            e.classList.add("action-copy");
            setTimeout(() => {
              e.classList.remove("action-copy");
            }, 1500);
          });
        });
      }
    },
    checkFormInfo: function () {
      const _this = this;
      const urlInfo = window.location.href;
      const formInfo = document.querySelector(".form-infor");
      const formErr = document.querySelector(".form-infor-body.noti-error");
      const formSuccess = document.querySelector(
        ".form-infor-body.noti-success"
      );
      const fi = document.querySelector(".form-infor,.close-form-info");
      if (fi) {
        fi.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const closet = target.closest(".form-infor");
          e.preventDefault();
          if (closet.classList.contains("show-noti-form")) {
            closet.classList.remove("show-noti-form");
          }
        });
      }
      if (urlInfo.indexOf("customer_posted=true") >= 1) {
        formInfo.classList.add("show-noti-form");
        formErr.style.display = "none";
        _this.setCookie("tps-newsletter-popup", 99999, "tps");
        const newURL = location.href.split("?")[0];
        window.history.pushState("object", document.title, newURL);
      }
      if (
        urlInfo.indexOf("contact%5Btags%5D=newsletter&form_type=customer") >= 1
      ) {
        formInfo.classList.add("show-noti-form");
        formSuccess.style.display = "none";
        const newURL = location.href.split("?")[0];
        window.history.pushState("object", document.title, newURL);
      }
      if (urlInfo.indexOf("contact_posted=true") >= 1) {
        formInfo.classList.add("show-noti-form");
        formErr.style.display = "none";
        const newURL = location.href.split("?")[0];
        window.history.pushState("object", document.title, newURL);
      }
    },
    checkShowMsgStockNotify: function () {
      const urlInfo = window.location.href;
      const formInfo = document.querySelector(".stock-notify");
      const fi = document.querySelector(
        ".stock-notify,.close-form-stock-notify"
      );
      if (fi) {
        fi.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const closet = target.closest(".stock-notify");
          e.preventDefault();
          if (closet.classList.contains("show-noti-form")) {
            closet.classList.remove("show-noti-form");
          }
        });
      }
      if (urlInfo.indexOf("contact_posted=true#FormStockNotify") > -1) {
        formInfo.classList.add("show-noti-form");
        const newURL = location.href.split("?")[0];
        window.history.pushState("object", document.title, newURL);
      }
    },
  };
})();
TpsPopup.init();

var TpsLoginPopup = (function () {
  return {
    init: function () {
      this.showLogin();
    },
    clickTab: function () {
      const hidden = document.querySelectorAll("[data-login-hidden]");
      const show = document.querySelectorAll("[data-login-show]");
      const iTitle = document.querySelector(
        "#loginp_0 .dlg-heading .popup-title"
      );
      show.forEach((e) => {
        var s = e?.dataset.loginShow;
        e.addEventListener("click", function (el) {
          el.preventDefault();
          hidden.forEach((eh) => {
            var h = eh?.dataset.loginHidden;
            if (eh.getAttribute("aria-hidden") === "true" && s === h) {
              eh.setAttribute("aria-hidden", "false");
              if (iTitle) {
                iTitle.innerText = s;
              }
            } else {
              eh.setAttribute("aria-hidden", "true");
            }
          });
        });
      });
    },
    showLogin: function () {
      const action = document.querySelector(".action-login");
      const _this = this;
      if (action !== null) {
        action.addEventListener("click", (e) => {
          e.preventDefault();
          _this.fetchDataLogin();
          document.body.classList.add("login-popup-show");
        });
      }
    },
    fetchDataLogin: function () {
      const url = "/?section_id=login-popup";
      const _this = this;
      fetch(url)
        .then((response) => response.text())
        .then((responseText) => {
          const html = newParser.parseFromString(responseText, "text/html");
          const l = html.querySelector("#login-popup");
          if (l) {
            var login = EasyDialogBox.create(
              "loginp",
              "dlg dlg-disable-footer dlg-disable-drag",
              "Login",
              l.innerHTML
            );
            login.onClose = login.destroy;
            login.show();
          }
          _this.clickTab();
        })
        .catch((e) => {
          throw e;
        });
    },
  };
})();
TpsLoginPopup.init();

var TpsFakeOrder = (function () {
  return {
    init: function () {
      this.showFakeOrder();
    },
    showFakeOrder: function (e) {
      const prd = document.querySelector("#tps__fake-order");
      const delayTime = prd?.dataset.timeDelay;
      const displayTime = prd?.dataset.timeDisplay;

      var randomNumber = 0;
      var randomImg = 0;
      var lastRandomNumber = 0;

      if (prd != null) {
        const u = document.querySelector("#tps__data-url").innerHTML;
        const t = document.querySelector("#tps__data-title").innerHTML;
        const i = document.querySelector("#tps__data-img").innerHTML;
        const c = document.querySelector("#tps__data-user").innerHTML;

        const title = prd.querySelector("[data-title-fake]");
        const url = prd.querySelectorAll("[data-url]");
        const image = prd.querySelector("[data-img]");
        const user = prd.querySelector("[data-user]");
        const time = prd.querySelector("[data-time]");
        const prog = prd.querySelector("[data-progressbar]");

        const j = JSON.parse(u);
        const k = JSON.parse(t);
        const l = JSON.parse(i);
        const m = JSON.parse(c);

        const close = document.querySelector(".fake-order-close");
        const invail_fake_data = setInterval(randomData, delayTime);
        close.addEventListener("click", () => {
          clearInterval(invail_fake_data);
          prd.classList.remove("animate__fadeInUp");
          prd.classList.add("animate__fadeInDown");
          prog.style.animationDuration = "";
          prog.style.animationName = "";
          prog.style.animationFillMode = "";
          prog.style.background = "";
          prog.style.animationTimingFunction = "";
        });
        function randomData() {
          if (!prd.classList.contains("animate__fadeInUp")) {
            if (j.length > 0) {
              prd.style.removeProperty("display");
              prd.classList.add("animate__fadeInUp");
              prd.classList.remove("animate__fadeInDown");
              do {
                randomNumber = Math.floor(Math.random() * (m.length - 1) + 0);
                randomImg = Math.floor(Math.random() * (l.length - 1) + 0);
              } while (
                randomNumber == lastRandomNumber &&
                randomImg == lastRandomNumber
              );
              title.innerText = k[randomImg];
              user.innerText = m[randomNumber];
              if (image) {
                image.src = l[randomImg];
                image.alt = k[randomImg];
              }
              url.forEach((e) => {
                e.href = j[randomImg];
              });
              var fakeTimeOrder = Math.floor(Math.random() * 60 + randomNumber);
              time.innerText = fakeTimeOrder;
              prog.style.animationDuration = `${displayTime}ms`;
              prog.style.animationName = "tps-progressbar";
              prog.style.animationFillMode = "forwards";
              prog.style.animationTimingFunction = "linear";
              prog.style.background = "#111111";

              setTimeout(function () {
                prd.classList.remove("animate__fadeInUp");
                prd.classList.add("animate__fadeInDown");
                prog.style.animationDuration = "";
                prog.style.animationName = "";
                prog.style.animationFillMode = "";
                prog.style.animationTimingFunction = "";
                prog.style.background = "";
              }, displayTime);
            }
          }
        }
      }
    },
  };
})();
TpsFakeOrder.init();

var TpsBeforeYouLeave = (function () {
  return {
    init: function () {
      this.showPopup();
    },
    showPopup: function () {
      const id = document.querySelector("#TpsBefore");
      const delay = id?.dataset.timeDelay;
      var action = 0;

      if (id !== null) {
        var getPopup = setTimeout(() => {
          getTimeOut();
        }, delay * 1000);

        const addMultipleListeners = (
          el,
          types,
          listener,
          options,
          useCapture
        ) => {
          types.forEach((type) =>
            el.addEventListener(type, listener, options, useCapture)
          );
        };

        addMultipleListeners(
          document.querySelector("body"),
          ["scroll", "click", "mousemove", "keydown"],
          () => {
            setAction();
          }
        );
        const closeBefore = document.querySelector(".close-before");
        if (closeBefore) {
          closeBefore.addEventListener("click", () => {
            clearTimeout(getPopup);
            const bov = document.querySelector(".tps__overlay");
            if (bov) {
              bov.classList.add("d-none-overlay");
            }
            document.documentElement.classList.remove("hside_opened");
            id.classList.remove("tps__opend-popup");
          });
        }

        function getTimeOut() {
          action = action + 1;
          if (action >= 1) {
            const bov = document.querySelector(".tps__overlay");
            if (bov) {
              bov.classList.remove("d-none-overlay");
            }
            document.documentElement.classList.add("hside_opened");
            id.classList.add("tps__opend-popup");
            TpsPopup.copyPromotion();
          }
        }
        function setAction() {
          action = action - 1;
        }
      }
    },
  };
})();
TpsBeforeYouLeave.init();

const rdc = {
  mode: "same-origin",
  credentials: "same-origin",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
  },
};
let parser = new DOMParser();
const c = new Map();
const productRecommendationsSection = document.querySelector(
  ".product-recommendations"
);

var TpsReloadEvents = (function () {
  return {
    init: function () {
      this.setupEventListeners();
    },

    setupEventListeners: function () {
      document.addEventListener("shopify:section:load", function (event) {
        var id = event.detail.sectionId;

        var section = event.target.querySelector(
          "[" + "data-id" + '="' + id + '"]'
        );

        if (section != undefined) {
          const { type } = section?.dataset;
          switch (type) {
            case "instagram":
              TpsInstagramShopify.init();
              break;
            case "product_grid":
              TpsProductGridEvents.init();
              TpsProductTabEvents.init();
              TpsColorSwatchesShopify.init();
              break;
            case "product_carousel":
              TpsProductGridEvents.init();
              TpsProductTabEvents.init();
              TpsColorSwatchesShopify.init();
              break;
            case "recently_viewed_products":
              TpsRVProductsShopify.init();
              break;
            case "product_recommendations":
              TpsProductRecommendsEvents.init();
              break;
            case "product_single":
              TpsColorSwatchesShopify.init();
              break;
            case "product_deal":
              TpsColorSwatchesShopify.init();
              TpsCountdownTimer.init();
              break;
            default:
              break;
          }
        }
      });
    },
  };
})();
TpsReloadEvents.init();

var TpsInstagramShopify = (function () {
  return {
    init: function () {
      this.loadInstagram();
    },

    loadInstagram: function () {
      const ig_class = document.querySelectorAll(".tps__instagram-api");
      ig_class.forEach((e) => {
        if (e != undefined) {
          const { accessToken, images, igType } = e?.dataset;
          if (accessToken) {
            this.initInstagram(e, accessToken, images, igType);
          } else {
            console.warn("Access Token is invalid!");
          }
        }
      });
    },

    initInstagram: async function (nodeElement, at, num_img, igType) {
      const _this = this;
      let i = num_img !== undefined ? num_img : 4;
      const resp = await this.fetchCache(
        `https://graph.instagram.com/me/media?fields=caption,id,media_type,media_url,permalink,thumbnail_url,timestamp,username&access_token=${at}`,
        {
          cache: "force-cache",
        }
      );
      if (!resp) return;

      if (resp.error) {
        return console.error("Instagram error: ", resp.error?.message);
      }
      if (igType === "carousel") {
        _this.initCarousel(resp.data, nodeElement, i);
      } else {
        _this.initGrid(resp.data, nodeElement, i);
      }
    },

    fetchCache: function (u, fetchOption) {
      let cf = fetchOption !== undefined ? fetchOption : rdc;
      return new Promise((resolve, reject) => {
        if (c.get(u)) {
          return resolve(c.get(u));
        }
        fetch(u, cf)
          .then((res) => {
            if (res.ok) {
              const j = res.json();
              resolve(j);
              c.set(u, j);
              return j;
            } else {
              reject(res);
            }
          })
          .catch(reject);
      });
    },

    initCarousel: function (images, nodeElement, i) {
      images
        .filter(
          (d) => d.media_type === "IMAGE" || d.media_type === "CAROUSEL_ALBUM"
        )
        .slice(0, i)
        .forEach((image) => {
          var node = document.createElement("div");
          node.classList.add("swiper-slide");
          var responsiveImageNode = document.createElement("div");
          var node_ig_item = document.createElement("div");
          node_ig_item.classList.add("tps__instagram-item");
          var imgUrl = document.createElement("a");
          var ig_logo = document.createElement("span");
          ig_logo.classList.add("tps__instagram-icon");
          responsiveImageNode.classList.add("tps__responsive-image");
          responsiveImageNode.classList.add("tps_instagram-image");
          responsiveImageNode.classList.add("tps-image-js");
          responsiveImageNode.setAttribute("style", "--aspect-ratio:1/1");
          responsiveImageNode.innerHTML += `<img src="${image.media_url}" srcset="${image.media_url}&width=165 165w,${image.media_url}&width=330 330w,${image.media_url}&width=535 535w,${image.media_url}&width=750 750w,${image.media_url}&width=1000 1000w,${image.media_url}&width=1500 1500w,${image.media_url}&width=3000 3000w" sizes="(min-width: 1260px) 282px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)" loading="lazy" alt="instagram">`;
          imgUrl.setAttribute("href", image.permalink);
          imgUrl.appendChild(responsiveImageNode);
          imgUrl.appendChild(ig_logo);
          node_ig_item.appendChild(imgUrl);
          node.appendChild(node_ig_item);
          nodeElement.querySelector(".swiper-wrapper").appendChild(node);
        });
      TpsLazyloadImg.init();
    },

    initGrid: function (images, nodeElement, limits) {
      const _this = this;
      const gridNode = nodeElement.querySelector(".tps__instagram-grid");
      if (gridNode) {
        const { spacing } = gridNode?.dataset;
        nodeElement.setAttribute("style", "--bs-gutter-x:" + spacing + "px");
        var items = Number(limits);
        images
          .filter(
            (d) => d.media_type === "IMAGE" || d.media_type === "CAROUSEL_ALBUM"
          )
          .slice(0, items)
          .forEach((image) => {
            var node = document.createElement("div");
            node.classList.add("tps__instagram-item");
            var imgUrl = document.createElement("a");
            var ig_logo = document.createElement("span");
            ig_logo.classList.add("tps__instagram-icon");
            var nodeChild = document.createElement("div");
            nodeChild.classList.add("tps__responsive-image");
            nodeChild.classList.add("tps-image-js");
            nodeChild.setAttribute("style", "--aspect-ratio: 1/1");
            nodeChild.classList.add("tps_instagram-image");
            nodeChild.innerHTML += `<img src="${image.media_url}" srcset="${image.media_url}&width=165 165w,${image.media_url}&width=330 330w,${image.media_url}&width=535 535w,${image.media_url}&width=750 750w,${image.media_url}&width=1000 1000w,${image.media_url}&width=1500 1500w,${image.media_url}&width=3000 3000w" sizes="(min-width: 1260px) 282px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)" loading="lazy" alt="instagram">`;
            imgUrl.setAttribute("href", image.permalink);
            imgUrl.appendChild(nodeChild);
            imgUrl.appendChild(ig_logo);
            node.appendChild(imgUrl);
            gridNode.querySelector(".row").appendChild(node);
            TpsLazyloadImg.init();
          });
      }
    },
  };
})();
TpsInstagramShopify.init();

var TpsProductGridEvents = (function () {
  return {
    init: function () {
      this.setupEventListeners();
    },

    setupEventListeners: function () {
      const _this = this;
      document.querySelectorAll(".tps__btn-load-more").forEach((el) => {
        el.addEventListener("click", function () {
          const sectionId = this.closest(".tps__grid").dataset.id;
          _this.loadButtonLoadMore(sectionId);
        });
      });
    },

    loadButtonLoadMore: function (sectionId) {
      const defClass = document.querySelector(
        ".tps__load-more_wrap-" + sectionId
      );
      if (defClass != undefined) {
        const { nextUrl, currentPage, totalPages } = defClass?.dataset;
        this.loadMore(defClass, sectionId, nextUrl, currentPage, totalPages);
      }
    },

    loadMore: function (defClass, sectionId, nextUrl, currentPage, totalPages) {
      const grid = document.querySelector("#tps__product-grid-" + sectionId);
      if (grid != undefined) {
        const { id, r, d, to } = grid?.dataset;
        const loadMoreBtn = defClass.querySelector('[type="button"]');
        loadMoreBtn.classList.add("btn-loading");
        let nextPage = parseInt(currentPage) + 1;
        fetch(`${nextUrl}?page=${nextPage}&section_id=${id}`)
          .then((response) => response.text())
          .then((responseText) => {
            const productNodes = parser.parseFromString(
              responseText,
              "text/html"
            );
            const productNodesHtml = productNodes.querySelectorAll(
              `#tps__product-grid-${sectionId} .tps__product-load`
            );
            productNodesHtml.forEach((prodNode) =>
              document
                .getElementById(`tps__product-grid-${sectionId}`)
                .appendChild(prodNode)
            );
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            loadMoreBtn.classList.remove("btn-loading");
            if (nextPage == totalPages) {
              defClass.remove();
            } else {
              defClass.setAttribute("data-current-page", nextPage);
            }
            TpsColorSwatchesShopify.init();
            TpsSectionProductAddCart.updateBtnAdd();
            TpsSubActionProduct.init();
            TpsReloadSpr.init();
            TpsLazyloadImg.init();
          });
      }
    },
  };
})();
TpsProductGridEvents.init();

var TpsProductTabEvents = (function () {
  return {
    init: function () {
      this.setupEventListeners();
      this.setupDropdownStyle();
      document.addEventListener("click", this.closeAllSelect);
    },

    setupEventListeners: function (value) {
      document.querySelectorAll(".tps__collection-tab").forEach((el) => {
        const tab_item = el.querySelectorAll(".tps__collection-tab-item");
        if (tab_item.length != 0) {
          tab_item.forEach((e) => {
            e.addEventListener("click", function () {
              if (!this.classList.contains("active")) {
                el.querySelectorAll(".tps__collection-tab-item").forEach(
                  (element) => {
                    element.classList.remove("active");
                  }
                );
                this.classList.add("active");
                const tabId = this.dataset.id;
                el.querySelectorAll(".tps__cls-tab").forEach((element) => {
                  if (element.id === tabId) {
                    if (!element.classList.contains("active")) {
                      el.querySelectorAll(".tps__cls-tab").forEach((elm) => {
                        elm.classList.remove("active");
                      });
                      element.classList.add("active");
                    }
                  }
                });
              }
            });
          });
        } else {
          const tabId = value;
          el.querySelectorAll(".tps__cls-tab").forEach((element) => {
            if (element.id === tabId) {
              if (!element.classList.contains("active")) {
                el.querySelectorAll(".tps__cls-tab").forEach((elm) => {
                  elm.classList.remove("active");
                });
                element.classList.add("active");
              }
            }
          });
        }
      });
    },

    setupDropdownStyle: function () {
      const _this = this;
      var x, i, j, l, ll, selElmnt, a, b, z, p, o;
      x = document.getElementsByClassName("custom-select");
      l = x.length;
      if (l > 0) {
        for (i = 0; i < l; i++) {
          selElmnt = x[i].getElementsByTagName("select")[0];
          x[i].innerHTML = "";
          x[i].appendChild(selElmnt);
          ll = selElmnt.length;
          a = document.createElement("div");
          a.setAttribute(
            "class",
            "select-selected flex justify-content-between w-full"
          );
          p = document.createElement("span");
          p.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
          a.appendChild(p);
          o = document.createElement("span");
          o.setAttribute("class", "select-arrow");
          o.innerHTML = `<svg fill="currentColor" width="20px" height="20px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M441.9 167.3l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L224 328.2 42.9 147.5c-4.7-4.7-12.3-4.7-17 0L6.1 167.3c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17z"></path></svg>`;
          a.appendChild(o);
          x[i].appendChild(a);
          b = document.createElement("div");
          b.setAttribute("class", "select-items select-hide");
          for (j = 0; j < ll; j++) {
            z = document.createElement("div");
            z.innerHTML = selElmnt.options[j].innerHTML;
            if (selElmnt.options[j].getAttribute("selected")) {
              z.setAttribute("class", "same-as-selected");
            }
            z.addEventListener("click", function (e) {
              var y, i, k, s, h, sl, yl;
              s = this.parentNode.parentNode.getElementsByTagName("select")[0];
              sl = s.length;
              h = this.parentNode.previousSibling;
              for (i = 0; i < sl; i++) {
                if (s.options[i].innerHTML == this.innerHTML) {
                  s.selectedIndex = i;
                  h.childNodes[0].innerHTML = this.innerHTML;
                  y =
                    this.parentNode.getElementsByClassName("same-as-selected");
                  yl = y.length;
                  for (k = 0; k < yl; k++) {
                    y[k].removeAttribute("class");
                  }
                  this.setAttribute("class", "same-as-selected");
                  break;
                }
              }
              s.dispatchEvent(new Event("change"));
              s.dispatchEvent(new Event("click"));
              h.click();
            });
            b.appendChild(z);
          }
          x[i].appendChild(b);
          a.addEventListener("click", function (e) {
            e.stopPropagation();
            _this.closeAllSelect(this);
            this.nextSibling.classList.toggle("select-hide");
            this.classList.toggle("select-arrow-active");
            _this.setupEventListeners(
              this.closest(".custom-select").querySelector(".select-data").value
            );
          });
        }
      }
    },
    closeAllSelect: function (elmnt) {
      var x,
        y,
        i,
        xl,
        yl,
        arrNo = [];
      x = document.getElementsByClassName("select-items");
      y = document.getElementsByClassName(
        "select-selected flex justify-content-between w-full"
      );
      xl = x.length;
      yl = y.length;
      for (i = 0; i < yl; i++) {
        if (elmnt == y[i]) {
          arrNo.push(i);
        } else {
          y[i].classList.remove("select-arrow-active");
        }
      }
      for (i = 0; i < xl; i++) {
        if (arrNo.indexOf(i)) {
          x[i].classList.add("select-hide");
        }
      }
    },
  };
})();
TpsProductTabEvents.init();

var TpsRVProductsShopify = (function () {
  return {
    init: function () {
      this.initRVProducts();
    },

    initRVProducts: function () {
      const _this = this;
      var elem = document.querySelectorAll(
        ".tps__product-recently-viewed-section"
      );
      if (elem) {
        var savedProductsArr = JSON.parse(
          localStorage.getItem("tps__recently-viewed-products")
        );
        if (savedProductsArr === null) {
          elem.forEach((e) => {
            e.closest(".shopify-section").remove();
          });
        } else {
          _this.getStoredProducts(savedProductsArr.reverse());
        }
      }
    },

    getStoredProducts: function (product) {
      var query = "";
      product.forEach((e, key, product) => {
        if (!Object.is(product.length - 1, key)) {
          query += e.id + "%20OR%20id:";
        } else {
          query += e.id;
        }
      });

      var productAjaxURL =
        "?q=id:" +
        query +
        "&section_id=products-recently-viewed&sort_by=price-ascending";
      fetch(`${window.routes.search_url}${productAjaxURL}`)
        .then((response) => response.text())
        .then(async (responseText) => {
          document
            .querySelectorAll(".tps__product-recently-viewed")
            .forEach((ele) => {
              const html = parser.parseFromString(responseText, "text/html");
              let item_html = html.querySelectorAll(".tps__product-item");
              let arr = [];
              item_html.forEach((el) => {
                let obj = {
                  id: product.findIndex(
                    (x) => x.handle === el.dataset.productHandle
                  ),
                  node: el,
                };
                arr.push(obj);
              });
              arr.sort(function (a, b) {
                return a.id - b.id;
              });
              arr.forEach((n) => {
                var node = document.createElement("div");
                node.classList.add(
                  "swiper-slide",
                  "tps__product-preload-js",
                  "tps__rv-product-js",
                  "tps__grid"
                );
                node.appendChild(n.node);
                ele.querySelector(".swiper-wrapper").appendChild(node);
              });
              const tpsswiper = ele.querySelector(".tps__swiper");
              if (tpsswiper) {
                TpsSettingsSwiper.TpsCarousel(tpsswiper);
              }
            });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally((e) => {
          TpsColorSwatchesShopify.init();
          TpsSubActionProduct.init();
          TpsSectionProductAddCart.updateBtnAdd();
          TpsLazyloadImg.init();
        });
    },
  };
})();
TpsRVProductsShopify.init();

var TpsProductRecommendsEvents = (function () {
  return {
    init: function () {
      if (productRecommendationsSection) {
        const observer = new IntersectionObserver(this.handleIntersection, {
          rootMargin: "0px 0px 1200px 0px",
        });
        observer.observe(productRecommendationsSection);
      }
    },

    handleIntersection: function (entries, observer) {
      if (!entries[0].isIntersecting) return;

      observer.unobserve(productRecommendationsSection);

      const url = productRecommendationsSection.dataset.url;

      fetch(url)
        .then((response) => response.text())
        .then((text) => {
          const html = document.createElement("div");
          html.innerHTML = text;
          const recommendations = html.querySelector(
            ".product-recommendations"
          );
          if (recommendations && recommendations.innerHTML.trim().length) {
            productRecommendationsSection.innerHTML = recommendations.innerHTML;
          }
          if (productRecommendationsSection.querySelector(".tps__swiper")) {
            TpsSettingsSwiper.TpsCarousel(
              productRecommendationsSection.querySelector(".tps__swiper")
            );
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally((e) => {
          TpsColorSwatchesShopify.init();
          TpsSubActionProduct.init();
          TpsSectionProductAddCart.updateBtnAdd();
          TpsLazyloadImg.init();
        });
    },
  };
})();
TpsProductRecommendsEvents.init();

var TpsCountdownTimer = (function () {
  return {
    init: function () {
      this.handleCountdown();
      this.eventCountDownTimer();
    },

    eventCountDownTimer: function () {
      const element = document.querySelectorAll(".tps__countdown-timer");

      if (element.length === 0) return;
      element.forEach((e) => {
        const day = e.getAttribute("data-days");
        const hrs = e.getAttribute("data-hrs");
        const secs = e.getAttribute("data-secs");
        const mins = e.getAttribute("data-mins");
        const time = e.getAttribute("data-time");
        var countDownDate = new Date(time).getTime();
        var timer = setInterval(function () {
          var now = new Date().getTime();
          var distance = countDownDate - now;
          var days = Math.floor(distance / (1000 * 60 * 60 * 24));
          var hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          var seconds = Math.floor((distance % (1000 * 60)) / 1000);
          var html =
            '<span class="countdown-days"><span class="countdown_ti heading-weight">' +
            days +
            '</span> <span class="countdown_tx">' +
            day +
            "</span></span> " +
            '<span class="countdown-hours"><span class="countdown_ti heading-weight">' +
            hours +
            '</span> <span class="countdown_tx">' +
            hrs +
            "</span></span> " +
            '<span class="countdown-min"><span class="countdown_ti heading-weight">' +
            minutes +
            '</span> <span class="countdown_tx">' +
            mins +
            "</span></span> " +
            '<span class="countdown-sec"><span class="countdown_ti heading-weight">' +
            seconds +
            '</span> <span class="countdown_tx">' +
            secs +
            "</span></span>";
          const cd = e.querySelector(".tps__product-countdown");
          if (cd) {
            cd.innerHTML = html;
          }
          if (distance < 0) {
            clearInterval(timer);
          }
        }, 1000);
      });
    },

    handleCountdown: function () {
      var second = 1000,
        minute = second * 60,
        hour = minute * 60,
        day = hour * 24;
      const timer = document.querySelectorAll(".tps__timer");
      timer.forEach((e) => {
        const { timer } = e?.dataset;
        const dateParts = timer.split("-");
        const isoDate =
          dateParts[2] +
          "-" +
          dateParts[0].padStart(2, "0") +
          "-" +
          dateParts[1].padStart(2, "0") +
          "T00:00:00Z";
        if (Date.parse(isoDate)) {
          var countDown = new Date(isoDate).getTime();
          if (countDown) {
            setInterval(function () {
              var now = new Date().getTime(),
                distance = countDown - now;
              if (countDown >= now) {
                (e.querySelector(".js-timer-days").innerText =
                  Math.floor(distance / day) < 10
                    ? ("0" + Math.floor(distance / day)).slice(-2)
                    : Math.floor(distance / day)),
                  (e.querySelector(".js-timer-hours").innerText = (
                    "0" + Math.floor((distance % day) / hour)
                  ).slice(-2)),
                  (e.querySelector(".js-timer-minutes").innerText = (
                    "0" + Math.floor((distance % hour) / minute)
                  ).slice(-2)),
                  (e.querySelector(".js-timer-seconds").innerText = (
                    "0" + Math.floor((distance % minute) / second)
                  ).slice(-2));
              }
            }, second);
          }
        }
      });
    },
  };
})();
TpsCountdownTimer.init();

var TpsSectionProductAddCart = (function () {
  const miniCart =
    document.querySelector("cart-notification") ||
    document.querySelector("cart-drawer");
  return {
    init: function () {
      this.initBtnAdd();
    },

    updateBtnAdd: function () {
      const btnAdd = document.querySelectorAll(".tps__js-addtocart");
      btnAdd.forEach((event) => {
        event.removeEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            this.actionAddToCart(target);
          },
          false
        );
        event.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            this.actionAddToCart(target);
          },
          false
        );
      });
    },

    initBtnAdd: function () {
      const btnAdd = document.querySelectorAll(".tps__js-addtocart");
      btnAdd.forEach((event) => {
        event.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            this.actionAddToCart(target);
          },
          false
        );
      });
    },

    updateMasterId(options, variantData) {
      var result = variantData.find((variant) => {
        return !variant.options
          .map((option, index) => {
            return options[index] === option;
          })
          .includes(false);
      });
      return result;
    },

    actionAddToCart: function (e) {
      const _this = this;
      e.classList.add("btn-loading");
      const productTarget = e.closest(".tps__product-item");
      const exist_load = e.querySelectorAll("span.loader-icon");
      if (exist_load.length === 0) {
        const exist_loading = e.querySelectorAll("div.loader-icon");
        if (exist_loading.length === 0) {
          const spanLoading = document.createElement("div");
          spanLoading.classList.add("loader-icon");
          e.appendChild(spanLoading);
        }
      }
      const qty_input = productTarget.querySelector(".tps__product-qty-js");
      var qty = 1;
      if (qty_input && qty_input.value > 1) {
        qty = qty_input.value;
      }
      const p = productTarget.querySelector(".tps__product-addtocart-js");
      const prodVariantId = p.dataset.productVariantId;
      const sectionMiniCart = miniCart
        .getSectionsToRender()
        .map((section) => section.id);
      // const sectionMiniCart = ["cart"];
      if (productTarget.querySelector(".productinfo")) {
        const variantData = JSON.parse(
          productTarget.querySelector(".productinfo").textContent
        );
        let options = Array.from(
          productTarget.querySelectorAll(".tps__option-swatch-js.active"),
          (select) => select.getAttribute("data-value")
        );
        const currentVariant = this.updateMasterId(options, variantData);
        if (!currentVariant) {
          _this.selectOption(productTarget, e);
          return;
        }
      }
      _this.fetchAddCart(prodVariantId, qty, sectionMiniCart, e);
    },

    selectOption: function (productTarget, e) {
      const productHandle = productTarget.dataset.productHandle;
      fetch(
        `${window.Shopify.routes.root}products/${productHandle}/?section_id=product-quickview`
      )
        .then((response) => response.text())
        .then((responseText) => {
          const html = parser.parseFromString(responseText, "text/html");
          html
            .querySelectorAll("#shopify-section-product-quickview")
            .forEach((el) => {
              var quickviewBox = EasyDialogBox.create(
                "dlg-product-quickview",
                "dlg dlg-disable-heading dlg-multi dlg-disable-footer dlg-disable-drag",
                "",
                el.innerHTML
              );
              quickviewBox.onClose = quickviewBox.destroy;
              quickviewBox.show();
              TpsColorSwatchesShopify.init();
              Shopify.swiperSlideQickview();
              Shopify.eventFlashSold("dlg");
              Shopify.eventCountDownTimer("dlg");
              TpsReloadSpr.init();
              Shopify.PaymentButton.init();
              TpsLazyloadImg.init();
            });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          e.classList.remove("btn-loading");
          e.querySelectorAll(".loader-icon").forEach((el) => {
            el.remove();
          });
          Shopify.termsConditionsAction();
          TpsSubActionProduct.handleActionWishlist();
          TpsSubActionProduct.handleInitWishlist();
          TpsSubActionProduct.handleActionCompare();
          TpsSubActionProduct.handleInitCompare();
          TpsSubActionProduct.showPopupStockNotify();
        });
    },

    fetchAddCart: function (variantId, quantity, properties, e) {
      fetch(`${routes.cart_add_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id: Number(variantId),
          quantity: Number(quantity),
          sections: properties,
        }),
      })
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
          miniCart.getSectionsToRender().forEach((section) => {
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
            const countdown = miniCart.querySelector(".cart-countdown-time");
            const html_countdown = html.querySelector(".cart-countdown-time");
            if (countdown && html_countdown) {
              countdown.innerHTML = html_countdown.innerHTML;
              miniCart.countdownTimer();
            }
          });
          miniCart.cartAction();
        })
        .catch((e) => {
          throw e;
        })
        .finally(() => {
          e.classList.remove("btn-loading");
          e.querySelectorAll(".loader-icon").forEach((el) => {
            el.remove();
          });
          if (miniCart && miniCart.classList.contains("is-empty"))
            miniCart.classList.remove("is-empty");
          miniCart.open();
          Shopify.termsConditionsAction();
          TpsLazyloadImg.init();
        });
    },
  };
})();
TpsSectionProductAddCart.init();

("use strict");

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
              const it =
                is_page_wishlist.querySelectorAll(".tps__product-item");
              if (wishlist_items.length <= 1 || it.length < 1) {
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
              const it = is_page_compare.querySelectorAll(".tps__product-item");
              if (compare_items.length <= 1 || it.length < 1) {
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
        fetch(
          `${window.Shopify.routes.root}products/${handle}/?section_id=product-quickview`
        )
          .then((response) => response.text())
          .then((responseText) => {
            const html = parser.parseFromString(responseText, "text/html");
            html
              .querySelectorAll("#shopify-section-product-quickview")
              .forEach((el) => {
                var quickviewBox = EasyDialogBox.create(
                  "qvdialog",
                  "dlg dlg-disable-heading dlg-multi dlg-disable-footer dlg-disable-drag",
                  "",
                  el.innerHTML
                );
                quickviewBox.onClose = quickviewBox.destroy;
                quickviewBox.show();
                TpsColorSwatchesShopify.init();
                TpsReloadSpr.init();
                Shopify.eventFlashSold("dlg");
                Shopify.eventCountDownTimer("dlg");
                Shopify.swiperSlideQickview();
                TpsLazyloadImg.init();
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
            _this.showPopupStockNotify();
            Shopify.termsConditionsAction();
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
        const tooltip_wishlist = e.querySelector(".wishlist-tooltip-content");
        const productHandle = e.dataset.productHandle;
        if (wishlist_items !== null) {
          let index = wishlist_items.indexOf(productHandle);
          if (index !== -1) {
            e.querySelector(".tps__product-icon").classList.add("active");
            if (is_page_wishlist) {
              tooltip_wishlist.innerText =
                window.stringsTemplate.messageRemoveWishlist;
            } else {
              tooltip_wishlist.innerText = proRemoveWishlist;
            }
          } else {
            e.querySelector(".tps__product-icon").classList.remove("active");
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
            window.location.href = `${window.shopUrl}${window.Shopify.routes.root}pages/wishlistremove`;
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
          window.location.href = `${window.shopUrl}${window.Shopify.routes.root}pages/compare`;
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
        const tooltip_compare = e.querySelector(".tps_tooltip-content");
        const productHandle = e.dataset.productHandle;
        if (compare_items !== null) {
          let index = compare_items.indexOf(productHandle);
          if (index !== -1) {
            e.querySelector(
              ".tp-product-details-action-sm-btn-wishlist"
            ).classList.add("active");
            if (is_page_compare) {
              tooltip_compare.innerText =
                window.stringsTemplate.messageRemoveCompare;
            } else {
              tooltip_compare.innerText = proRemoveCompare;
            }
          } else {
            e.querySelector(".tps__product-icon").classList.remove("active");
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
              "dlg dlg-multi dlg-disable-footer dlg-disable-drag",
              text,
              id.innerHTML
            );
            createPopupStock.center();
            createPopupStock.onClose = createPopupStock.destroy;
            createPopupStock.show();
          }
        })
        .catch((e) => {
          throw e;
        });
    },
  };
})();
TpsSubActionProduct.init();

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

var TpsMainMenuShopify = (function () {
  return {
    init: function () {
      this.initMainMenu();
      this.initVerticalMenu();
    },
    initMainMenu: function () {
      var _this = this;
      const header = document.querySelector(global.header);
      const sticky = header.getAttribute("data-sticky");
      const sticky_mobile = header.getAttribute("data-sticky-mobile");
      const verticalmenu = document.querySelector(".verticalmenu-list");
      const tps_main_menu = document.querySelector(".tps_main_menu");
      _this.onMenuMobileItem();

      document.querySelectorAll(".nav-toggle").forEach((navToggle) => {
        navToggle.addEventListener("click", (e) => {
          if (document.documentElement.classList.contains("nav-open")) {
            document.documentElement.classList.remove("nav-open");
            if (!tps_main_menu) {
              document.documentElement.classList.remove("nav-verticalmenu");
            }
          } else {
            document.documentElement.classList.add("nav-open");
            if (!tps_main_menu) {
              document.documentElement.classList.add("nav-verticalmenu");
            }
          }
        });
      });

      document.querySelectorAll(".close-menu").forEach((closeToggle) => {
        closeToggle.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            document.documentElement.classList.remove("nav-open");
          },
          false
        );
      });

      if (verticalmenu && tps_main_menu) {
        const html_title =
          '<a data-menu="verticalmenu-list" href="#">' +
          window.menuStrings.verticalTitle +
          "</a>";
        const verticalmenu_html =
          document.querySelector(".verticalmenu-list").innerHTML;
        const el = document.createElement("ul");
        el.classList.add("verticalmenu-list");
        el.style.display = "none";
        el.innerHTML = verticalmenu_html;
        document
          .querySelector(".tps_main_menu .mobile-menu-content")
          .appendChild(el);
        document
          .querySelector(".tps_main_menu .menu-mobile-title")
          .insertAdjacentHTML("beforeend", html_title);
        _this.onMenuMobileItem("verticalmenu");
      }

      document
        .querySelectorAll(".tps_main_menu .menu-mobile-title a")
        .forEach((navToggle) => {
          navToggle.addEventListener(
            "click",
            (e) => {
              e.preventDefault();
              const target = e.currentTarget;
              const data = target.getAttribute("data-menu");
              for (var item_title of document.querySelectorAll(
                ".tps_main_menu .menu-mobile-title a"
              )) {
                item_title.classList.remove("active");
              }
              target.classList.add("active");
              for (var item_menu of document.querySelectorAll(
                ".tps_main_menu .mobile-menu-content > ul"
              )) {
                item_menu.style.display = "none";
              }
              document.querySelector(
                ".tps_main_menu ." + data + ""
              ).style.display = "block";
            },
            false
          );
        });

      document
        .querySelectorAll("li.tps__menu-parent")
        .forEach((menuItem, index) => {
          menuItem.addEventListener("mouseenter", (e) =>
            _this.onMenuItemEnter(menuItem, index)
          );
          menuItem.addEventListener("mouseleave", (e) =>
            _this.onMenuItemLeave(menuItem, index)
          );
        });

      document
        .querySelectorAll(".tps-menu-item.type_banner")
        .forEach((menuItem, index) => {
          if (menuItem.classList.contains("space-banner")) {
            menuItem.closest(".submenu").classList.add("submenu-space-banner");
          }
        });

      document.querySelectorAll("li.advanced-main a").forEach((item) => {
        item.addEventListener(
          "mouseenter",
          (e) => {
            const target = e.currentTarget;
            const data = target.getAttribute("data-link");
            if (data) {
              for (var item_content of document.querySelectorAll(
                "li.advanced-content > .sub"
              )) {
                item_content.classList.remove("active");
              }
              for (var item of document.querySelectorAll(
                "li.advanced-main a"
              )) {
                item.classList.remove("active");
              }
              target.classList.add("active");
              document.querySelector(data).classList.add("active");
            }
          },
          false
        );
      });
      let headerbar = 0;
      if (document.getElementById("announcement-bar")) {
        headerbar = document.getElementById("announcement-bar").clientHeight;
      }
      let headertopbar = 0;
      if (document.getElementById("shopify-section-top-bar")) {
        headertopbar = document.getElementById(
          "shopify-section-top-bar"
        ).clientHeight;
      }
      // let headerpage = document.getElementById("page-header").clientHeight;
      // let headerpage = document.getElementById("page-header").offsetHeight
      let headerpage = 300;
      document
        .querySelector("body")
        .setAttribute(
          "style",
          "--height-bar: " +
            headerbar +
            "px;--height-header: " +
            headerpage +
            "px "
        );
      if (sticky == "true") {
        if (sticky_mobile == "false" && window.innerWidth < 1025) {
          return;
        }
        let headerSpaceH =
          document.getElementById("sticky-header").offsetHeight;
        let newdiv = document.createElement("div");
        let headerh = headerbar + headertopbar + headerSpaceH;
        newdiv.style.height = headerSpaceH + "px";
        newdiv.classList.add("headerSpace", "unvisible");
        document.querySelector("#sticky-header").after(newdiv);
        window.addEventListener("scroll", () => {
          const currentScroll = window.pageYOffset;
          if (
            currentScroll <= header.querySelector(".header-middle").offsetTop
          ) {
            if (header.classList.contains("transparent")) {
              header.classList.add("transparent");
            }
            return;
          }
          if (header.classList.contains("transparent")) {
            header.classList.remove("transparent");
          }
        });
        window.addEventListener("scroll", () => {
          stickyFunction();
        });
        function stickyFunction() {
          if (window.pageYOffset > headerh) {
            header.classList.add("header_scroll_down");
            header.classList.add("header_scroll_up");
            header.querySelector(".headerSpace").classList.remove("unvisible");
            TpsOptimize();
            if (document.querySelector(".extent-button-right-bar")) {
              document
                .querySelector(".extent-button-right-bar")
                .classList.add("d-xxl-block");
              let extentButtonRightBar = document.querySelector(
                ".extent-button-right-bar"
              );
              let btnFixed = document.querySelector(".btn-fixed");
              if (btnFixed === null) {
                let htmlbuttonright = `<div class="btn-fixed">
                  <a class="demo content-fixed pointer" role="link" aria-label="Select Demos">
                    <span class="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2406 0.780116C10.7017 0.346314 11.3492 0.218262 12.0519 0.218262H15.3573C16.06 0.218262 16.7074 0.346314 17.1686 0.780116C17.6389 1.22258 17.7819 1.85492 17.7819 2.53644V8.10008C17.7819 8.7816 17.6389 9.41395 17.1686 9.85641C16.7074 10.2902 16.06 10.4183 15.3573 10.4183H12.0519C11.3492 10.4183 10.7017 10.2902 10.2406 9.85641C9.77031 9.41395 9.62732 8.7816 9.62732 8.10008V2.53644C9.62732 1.85492 9.77031 1.22258 10.2406 0.780116ZM11.0629 1.65413C10.9461 1.76395 10.8273 1.99069 10.8273 2.53644V8.10008C10.8273 8.64583 10.9461 8.87258 11.0629 8.98239C11.1888 9.10086 11.4537 9.21826 12.0519 9.21826H15.3573C15.9555 9.21826 16.2204 9.10086 16.3463 8.98239C16.463 8.87258 16.5819 8.64583 16.5819 8.10008V2.53644C16.5819 1.99069 16.463 1.76395 16.3463 1.65413C16.2204 1.53566 15.9555 1.41826 15.3573 1.41826H12.0519C11.4537 1.41826 11.1888 1.53566 11.0629 1.65413Z" fill="#212529"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2406 12.2345C10.7017 11.8007 11.3492 11.6726 12.0519 11.6726H15.3573C16.06 11.6726 16.7074 11.8007 17.1686 12.2345C17.6389 12.6769 17.7819 13.3093 17.7819 13.9908V15.4635C17.7819 16.145 17.6389 16.7774 17.1686 17.2198C16.7074 17.6536 16.06 17.7817 15.3573 17.7817H12.0519C11.3492 17.7817 10.7017 17.6536 10.2406 17.2198C9.77031 16.7774 9.62732 16.145 9.62732 15.4635V13.9908C9.62732 13.3093 9.77031 12.6769 10.2406 12.2345ZM11.0629 13.1085C10.9461 13.2183 10.8273 13.445 10.8273 13.9908V15.4635C10.8273 16.0093 10.9461 16.236 11.0629 16.3458C11.1888 16.4643 11.4537 16.5817 12.0519 16.5817H15.3573C15.9555 16.5817 16.2204 16.4643 16.3463 16.3458C16.463 16.236 16.5819 16.0093 16.5819 15.4635V13.9908C16.5819 13.445 16.463 13.2183 16.3463 13.1085C16.2204 12.99 15.9555 12.8726 15.3573 12.8726H12.0519C11.4537 12.8726 11.1888 12.99 11.0629 13.1085Z" fill="#212529"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.6537 9.01766C1.53697 9.12747 1.41814 9.35422 1.41814 9.89997V15.4636C1.41814 16.0094 1.53697 16.2361 1.6537 16.3459C1.77962 16.4644 2.04448 16.5818 2.64269 16.5818H5.94814C6.54634 16.5818 6.8112 16.4644 6.93713 16.3459C7.05385 16.2361 7.17269 16.0094 7.17269 15.4636V9.89997C7.17269 9.35422 7.05385 9.12747 6.93713 9.01766C6.8112 8.89919 6.54634 8.78179 5.94814 8.78179H2.64269C2.04448 8.78179 1.77962 8.89919 1.6537 9.01766ZM0.831448 8.14364C1.29256 7.70984 1.93998 7.58179 2.64269 7.58179H5.94814C6.65085 7.58179 7.29826 7.70984 7.75938 8.14364C8.2297 8.5861 8.37269 9.21845 8.37269 9.89997V15.4636C8.37269 16.1451 8.2297 16.7775 7.75938 17.2199C7.29826 17.6537 6.65085 17.7818 5.94814 17.7818H2.64269C1.93998 17.7818 1.29256 17.6537 0.831448 17.2199C0.361128 16.7775 0.21814 16.1451 0.21814 15.4636V9.89997C0.21814 9.21844 0.361128 8.5861 0.831448 8.14364Z" fill="#212529"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.6537 1.65413C1.53697 1.76395 1.41814 1.99069 1.41814 2.53644V4.00917C1.41814 4.55492 1.53697 4.78167 1.6537 4.89148C1.77962 5.00995 2.04448 5.12735 2.64269 5.12735H5.94814C6.54634 5.12735 6.8112 5.00995 6.93713 4.89148C7.05385 4.78167 7.17269 4.55492 7.17269 4.00917V2.53644C7.17269 1.99069 7.05385 1.76395 6.93713 1.65413C6.8112 1.53566 6.54634 1.41826 5.94814 1.41826H2.64269C2.04448 1.41826 1.77962 1.53566 1.6537 1.65413ZM0.831448 0.780116C1.29256 0.346314 1.93998 0.218262 2.64269 0.218262H5.94814C6.65085 0.218262 7.29826 0.346314 7.75938 0.780116C8.2297 1.22258 8.37269 1.85492 8.37269 2.53644V4.00917C8.37269 4.69069 8.2297 5.32304 7.75938 5.7655C7.29826 6.1993 6.65085 6.32735 5.94814 6.32735H2.64269C1.93998 6.32735 1.29256 6.1993 0.831448 5.7655C0.361128 5.32304 0.21814 4.69069 0.21814 4.00917V2.53644C0.21814 1.85492 0.361128 1.22258 0.831448 0.780116Z" fill="#212529"/>
                      </svg>
                    </span>
                    <span class="box-desc tooltip-f"> Select Demos </span>
                  </a>
                  <a
                    href="https://blueskytechmage.com/shopify/uminio-theme/#features"
                    aria-label="Features"
                    class="content-fixed"
                    target="_blank"
                  >
                    <span class="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="18" height="18" fill="none"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.54404 1.54059C2.65827 0.42709 4.3263 0 6.48283 0H11.5172C13.6737 0 15.3417 0.42709 16.456 1.54059C17.5716 2.65555 18 4.32629 18 6.48447V11.5155C18 13.6737 17.5716 15.3445 16.456 16.4594C15.3417 17.5729 13.6737 18 11.5172 18H6.48283C4.3263 18 2.65827 17.5729 1.54404 16.4594C0.428359 15.3445 0 13.6737 0 11.5155V6.48447C0 4.32629 0.428359 2.65555 1.54404 1.54059ZM2.40174 2.41437C1.62954 3.18607 1.21884 4.45011 1.21884 6.48447V11.5155C1.21884 13.5499 1.62954 14.8139 2.40174 15.5856C3.17539 16.3588 4.44406 16.7702 6.48283 16.7702H11.5172C13.5559 16.7702 14.8246 16.3588 15.5983 15.5856C16.3705 14.8139 16.7812 13.5499 16.7812 11.5155V6.48447C16.7812 4.45011 16.3705 3.18607 15.5983 2.41437C14.8246 1.64123 13.5559 1.22981 11.5172 1.22981H6.48283C4.44406 1.22981 3.17539 1.64123 2.40174 2.41437Z" fill="#212529"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.93317 4.37377C9.63723 3.61699 10.953 4.08433 10.953 5.1047V7.84039H11.8419C12.8317 7.84039 13.3686 8.95684 12.7098 9.67166C12.7097 9.67173 12.7099 9.6716 12.7098 9.67166L9.06683 13.6262C8.36277 14.383 7.047 13.9157 7.047 12.8953V10.1596H6.15811C5.16826 10.1596 4.63139 9.04315 5.2902 8.32833C5.29026 8.32827 5.29014 8.3284 5.2902 8.32833L8.93317 4.37377ZM9.75641 5.21051L6.25047 9.01633H7.6453C7.97572 9.01633 8.24359 9.27226 8.24359 9.58797V12.7895L11.7495 8.98367H10.3547C10.0243 8.98367 9.75641 8.72773 9.75641 8.41203V5.21051Z" fill="#212529"/>
                      </svg>
                    </span>
                    <span class="box-desc tooltip-f"> Features </span>
                  </a>
                  <a
                    href="https://themeforest.net/item/umino-multipurpose-shopify-themes-os-20/42969030"
                    aria-label="Buy Now"
                    target="_blank"
                    class="content-fixed show-mobile"
                  >
                    <span class="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.26846 10.156C6.59983 10.156 6.86846 10.4246 6.86846 10.756C6.86846 11.9231 7.83292 12.8875 9 12.8875C10.1671 12.8875 11.1315 11.9231 11.1315 10.756C11.1315 10.4246 11.4002 10.156 11.7315 10.156C12.0629 10.156 12.3315 10.4246 12.3315 10.756C12.3315 12.5858 10.8298 14.0875 9 14.0875C7.17018 14.0875 5.66846 12.5858 5.66846 10.756C5.66846 10.4246 5.93709 10.156 6.26846 10.156Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.93408 0.770732C7.16872 1.00472 7.16924 1.38462 6.93525 1.61926L4.11005 4.45226C3.87606 4.6869 3.49616 4.68742 3.26153 4.45343C3.02689 4.21944 3.02637 3.83954 3.26036 3.6049L6.08555 0.771903C6.31954 0.537265 6.69944 0.536741 6.93408 0.770732Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.066 0.770732C11.3006 0.536741 11.6805 0.537265 11.9145 0.771903L14.7397 3.6049C14.9737 3.83954 14.9732 4.21944 14.7385 4.45343C14.5039 4.68742 14.124 4.6869 13.89 4.45226L11.0648 1.61926C10.8308 1.38462 10.8313 1.00472 11.066 0.770732Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M2.03579 4.93786C1.9586 4.98956 1.79558 5.1378 1.79558 5.76122C1.79558 6.53405 1.97485 6.63591 2.00045 6.65046C2.00083 6.65067 2.00118 6.65087 2.00149 6.65105C2.04429 6.67571 2.1264 6.7033 2.29644 6.71579C2.42615 6.72532 2.55965 6.72432 2.72619 6.72307C2.7884 6.72261 2.85521 6.72211 2.92816 6.72211H15.0718C15.1448 6.72211 15.2116 6.72261 15.2738 6.72307C15.4403 6.72432 15.5738 6.72532 15.7035 6.71579C15.8736 6.7033 15.9557 6.67571 15.9985 6.65105L15.9995 6.65046C16.0251 6.63591 16.2044 6.53405 16.2044 5.76122C16.2044 5.1378 16.0414 4.98956 15.9642 4.93786C15.8225 4.84293 15.5702 4.80034 15.0718 4.80034H2.92816C2.42976 4.80034 2.17753 4.84293 2.03579 4.93786ZM1.368 3.94084C1.85256 3.61629 2.46661 3.60034 2.92816 3.60034H15.0718C15.5334 3.60034 16.1474 3.61629 16.632 3.94084C17.1811 4.30863 17.4044 4.94083 17.4044 5.76122C17.4044 6.65485 17.2027 7.34205 16.5977 7.69074C16.3273 7.84655 16.0363 7.89458 15.7915 7.91257C15.6088 7.92599 15.4055 7.92438 15.2249 7.92294C15.1715 7.92251 15.1201 7.92211 15.0718 7.92211H2.92816C2.87987 7.92211 2.82847 7.92251 2.7751 7.92294C2.59449 7.92438 2.3912 7.92599 2.2085 7.91257C1.96368 7.89458 1.67265 7.84655 1.40229 7.69074C0.797263 7.34205 0.595581 6.65485 0.595581 5.76122C0.595581 4.94083 0.818881 4.30863 1.368 3.94084Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M15.7467 6.84984C16.0721 6.91225 16.2854 7.22667 16.223 7.55211L14.9118 14.3886C14.9118 14.3887 14.9119 14.3885 14.9118 14.3886C14.7739 15.1091 14.593 15.9124 14.0279 16.5045C13.437 17.1236 12.5442 17.4044 11.2554 17.4044H6.54937C5.33588 17.4044 4.44854 17.1012 3.83769 16.4826C3.24376 15.8811 3.00535 15.0723 2.87463 14.2798L1.77404 7.53574C1.72067 7.20869 1.94252 6.90031 2.26957 6.84693C2.59661 6.79356 2.905 7.01542 2.95837 7.34246L4.05863 14.0845C4.0586 14.0843 4.05865 14.0846 4.05863 14.0845C4.17764 14.8057 4.36465 15.3084 4.69156 15.6394C5.00163 15.9535 5.5308 16.2044 6.54937 16.2044H11.2554C12.3938 16.2044 12.8941 15.9545 13.1598 15.676C13.4511 15.3707 13.5903 14.9096 13.7333 14.1629L15.0444 7.32609C15.1068 7.00065 15.4213 6.78743 15.7467 6.84984Z" fill="#111111"/>
                      </svg>
                    </span>
                    <span class="box-desc tooltip-f"> Buy Now </span>
                  </a>
                  <a
                    href="https://shopify.pxf.io/c/3722068/1061744/13624"
                    aria-label="Open Store"
                    target="_blank"
                    class="content-fixed"
                  >
                    <span class="icon-btn">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.72023 7.79663C2.03319 7.79663 2.2869 8.05183 2.2869 8.36663V12.0126C2.2869 13.7784 2.64417 14.8673 3.30633 15.5295C3.96931 16.1925 5.06039 16.5503 6.8279 16.5503H11.2047C12.9723 16.5503 14.0633 16.1925 14.7263 15.5295C15.3885 14.8673 15.7457 13.7784 15.7457 12.0126V8.36663C15.7457 8.05183 15.9994 7.79663 16.3124 7.79663C16.6254 7.79663 16.8791 8.05183 16.8791 8.36663V12.0126C16.8791 13.8929 16.5055 15.3578 15.5253 16.338C14.546 17.3173 13.0832 17.6903 11.2047 17.6903H6.8279C4.9494 17.6903 3.48665 17.3173 2.50729 16.338C1.52712 15.3578 1.15356 13.8929 1.15356 12.0126V8.36663C1.15356 8.05183 1.40727 7.79663 1.72023 7.79663Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M6.56445 0.822476C6.59366 0.531308 6.83732 0.309692 7.12826 0.309692H10.9204C11.2117 0.309692 11.4555 0.531786 11.4843 0.823321L12.0203 6.24768C12.1996 8.07135 10.839 9.56999 9.02029 9.56999C7.20157 9.56999 5.84091 8.0716 6.02028 6.24793L6.56445 0.822476ZM7.64063 1.44969L7.14811 6.36017C7.14809 6.36035 7.14813 6.36 7.14811 6.36017C7.03547 7.50828 7.86716 8.42999 9.02029 8.42999C10.1736 8.42999 11.0054 7.50853 10.8925 6.36017L10.4073 1.44969H7.64063Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.4677 0.497312C10.5751 0.377852 10.7278 0.309692 10.888 0.309692H13.3646C14.4858 0.309692 15.3931 0.52107 16.0521 1.12978C16.7043 1.73223 17.0057 2.6263 17.1578 3.72437C17.1587 3.73121 17.1595 3.73806 17.1602 3.74493L17.3877 5.97932C17.5838 7.94953 16.1173 9.56999 14.1442 9.56999C12.5168 9.56999 11.061 8.26389 10.8927 6.63078L10.8925 6.62899L10.3241 0.936659C10.3081 0.77638 10.3603 0.616773 10.4677 0.497312ZM11.5144 1.44969L12.02 6.51326C12.02 6.51298 12.0201 6.51355 12.02 6.51326C12.1283 7.55948 13.0922 8.42999 14.1442 8.42999C15.4515 8.42999 16.3885 7.38735 16.2601 6.09352C16.2601 6.0933 16.2601 6.09375 16.2601 6.09352L16.0339 3.87154C15.8933 2.86465 15.6431 2.29974 15.2855 1.96945C14.9335 1.64433 14.371 1.44969 13.3646 1.44969H11.5144Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.93987 1.12978C2.59887 0.52107 3.50613 0.309692 4.62729 0.309692H7.10398C7.26414 0.309692 7.41681 0.377863 7.52425 0.497342C7.63168 0.616821 7.68383 0.776449 7.6678 0.93674L7.09955 6.62736C7.09952 6.6276 7.09957 6.62711 7.09955 6.62736C6.94048 8.26363 5.48231 9.56999 3.85586 9.56999C1.88289 9.56999 0.41646 7.94975 0.61227 5.9797C0.612257 5.97983 0.612283 5.97958 0.61227 5.9797L0.831483 3.74698C0.832225 3.73943 0.833116 3.73189 0.834157 3.72437C0.986197 2.6263 1.28765 1.73223 1.93987 1.12978ZM1.9582 3.87052L1.74008 6.0921C1.61131 7.38625 2.54836 8.42999 3.85586 8.42999C4.90886 8.42999 5.87042 7.55977 5.97157 6.51669L5.97171 6.51523L6.47745 1.44969H4.62729C3.62092 1.44969 3.05841 1.64433 2.70643 1.96945C2.34898 2.29963 2.09878 2.86427 1.9582 3.87052Z" fill="#111111"/>
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M7.09724 13.1624C7.57954 12.6801 8.25662 12.4901 9.02033 12.4901C9.78403 12.4901 10.4611 12.6801 10.9434 13.1624C11.4263 13.6453 11.6171 14.3243 11.6171 15.0902V17.1203C11.6171 17.4351 11.3634 17.6903 11.0504 17.6903H6.99025C6.67729 17.6903 6.42358 17.4351 6.42358 17.1203V15.0902C6.42358 14.3243 6.61432 13.6453 7.09724 13.1624ZM7.89627 13.9708C7.70317 14.1639 7.55692 14.5 7.55692 15.0902V16.5503H10.4837V15.0902C10.4837 14.5 10.3375 14.1639 10.1444 13.9708C9.95067 13.7771 9.61271 13.6301 9.02033 13.6301C8.42794 13.6301 8.08999 13.7771 7.89627 13.9708Z" fill="#111111"/>
                      </svg>
                    </span>
                    <span class="box-desc tooltip-f"> Open Store </span>
                  </a>
                </div>`;
                extentButtonRightBar.insertAdjacentHTML(
                  "beforeend",
                  htmlbuttonright
                );
                customElements.define("feature-button", FeatureButton);
              }
            }
          } else {
            header.classList.remove("header_scroll_down");
            header.querySelector(".headerSpace").classList.add("unvisible");
            if (document.querySelector(".extent-button-right-bar")) {
              document
                .querySelector(".extent-button-right-bar")
                .classList.remove("d-xxl-block");
            }
          }
        }
      }

      if (tps_main_menu) {
        _this.addCssSubMenu();
        _this.loadImageMenu();
        window.addEventListener(
          "resize",
          function (event) {
            _this.addCssSubMenu();
          },
          true
        );
      }
    },
    initVerticalMenu: function () {
      let width = screen.width;
      const article = document.querySelector(".verticalmenu-html");
      if (article === null) return;
      const limitItemShow = article.dataset.limitshowitem;
      const limitScreen = article.dataset.limitscreen;
      const lenghtLi = document.querySelectorAll(
        ".verticalmenu-html .level0"
      ).length;
      if (width > 1199) {
        if (lenghtLi > limitItemShow) {
          var lineItem = Array.from(
            document.querySelectorAll(".verticalmenu-html .level0")
          );
          lineItem.forEach((element, index) => {
            if (index > limitItemShow - 1) {
              const item = lineItem[index];
              if (item.classList.contains("expand-menu-link")) {
                return;
              }
              item.classList.add("orther-link");
              item.style.display = "none";
            }
          });
          document.querySelector(
            ".verticalmenu-html .expand-menu-link"
          ).style.display = "block";
          document
            .querySelector(".verticalmenu-html .expand-menu-link a")
            .addEventListener(
              "click",
              (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (!parent.classList.contains("expanding")) {
                  parent.classList.add("expanding");
                  parent.querySelector("a").innerHTML =
                    window.menuStrings.hideMenus;
                  for (var item of document.querySelectorAll(
                    ".verticalmenu-html .level0.orther-link"
                  )) {
                    slideAnime({
                      target: item,
                      animeType: "slideDown",
                    });
                  }
                } else {
                  parent.classList.remove("expanding");
                  parent.querySelector("a").innerHTML =
                    window.menuStrings.moreMenus;
                  for (var item of document.querySelectorAll(
                    ".verticalmenu-html .level0.orther-link"
                  )) {
                    slideAnime({
                      target: item,
                      animeType: "slideUp",
                    });
                  }
                }
              },
              false
            );
        } else {
          document.querySelector(".expand-menu-link").style.display = "none";
        }
      }
      if (document.querySelector(".tps_vertical_menu .title-menu-dropdown")) {
        document
          .querySelector(".tps_vertical_menu .title-menu-dropdown")
          .addEventListener("click", (event) => {
            event.preventDefault();
            const target = event.currentTarget;
            const closest = target.closest(".vertical-menu");
            if (closest.classList.contains("open")) {
              closest.classList.remove("open");
              if (document.querySelector(".tps__overlay")) {
                document.documentElement.classList.remove("vetical-overlay");
                document
                  .querySelector(".tps__overlay")
                  .classList.add("d-none-overlay");
              }
            } else {
              closest.classList.add("open");
              if (document.querySelector(".tps__overlay")) {
                document.documentElement.classList.add("vetical-overlay");
                document
                  .querySelector(".tps__overlay")
                  .classList.remove("d-none-overlay");
              }
            }
          });
      }
    },
    onMenuItemEnter: function (evt, index) {
      const target = evt;
      target.classList.add("tps-item-active");
    },
    onMenuItemLeave: function (evt, index) {
      const target = evt;
      target.classList.remove("tps-item-active");
    },
    onMenuMobileItem: function (evt) {
      var menu_parent = "li.tps__menu-parent > .open-children-toggle";
      var menu_submenu = "li.tps__menu-parent .submenu .open-children-toggle";
      if (evt) {
        menu_parent =
          ".verticalmenu-list li.tps__menu-parent > .open-children-toggle";
        menu_submenu =
          ".verticalmenu-list li.tps__menu-parent .submenu .open-children-toggle";
      }
      document.querySelectorAll(menu_parent).forEach((childrenToggle) => {
        childrenToggle.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            const parent = target.parentElement;
            const submenu = parent.querySelector(".submenu");
            slideAnime({
              target: submenu,
              animeType: "slideToggle",
            });
            if (!parent.querySelector("a").classList.contains("active")) {
              parent.querySelector("a").classList.add("active");
            } else {
              parent.querySelector("a").classList.remove("active");
            }
          },
          false
        );
      });

      document.querySelectorAll(menu_submenu).forEach((childrenToggle) => {
        childrenToggle.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const parent = target.parentElement;
          const submenu = parent.querySelector(".subchildmenu");
          slideAnime({
            target: submenu,
            animeType: "slideToggle",
          });
          if (!parent.querySelector("a").classList.contains("active")) {
            parent.querySelector("a").classList.add("active");
          } else {
            parent.querySelector("a").classList.remove("active");
          }
        });
      });
    },
    addCssSubMenu: function () {
      const bodyWidth =
        document.documentElement.clientWidth || document.body.clientWidth;
      const header = document.querySelector("header");
      const submenu_center = document.querySelector(".tps_submenu-center");
      const width_sub_center = document
        .querySelector("[data-width-sub-center]")
        .getAttribute("data-width-sub-center");
      if (!header || bodyWidth < 1024) return;
      var padding = 30;
      if (bodyWidth < 1200) {
        padding = 15;
      }
      document
        .querySelectorAll(".horizontal-list .menu-width-custom > .submenu")
        .forEach((submenu) => {
          if (submenu_center) {
            var submenu_data = submenu.getBoundingClientRect();
            var width = submenu_data.width;
            var left = submenu_data.left;
            var right = submenu_data.right;
            if (width_sub_center <= width) {
              var left_style = (left - (right - bodyWidth)) / 2;
              submenu.style.left = left_style + "px";
            }
          } else {
            const elementWidth = submenu.clientWidth;
            const elementLeft = submenu.offsetLeft;
            if (bodyWidth - (elementWidth + elementLeft) < 0) {
              var left = bodyWidth - (elementWidth + elementLeft);
              left = left + elementLeft - padding;
              if (elementLeft < 0) {
                left = 0;
              }
              submenu.style.left = left + "px";
            }
          }
        });
    },
    loadImageMenu: function () {
      const menu_parent = document.querySelectorAll(".tps__menu-parent");
      var width = window.innerWidth;
      menu_parent.forEach((menu) => {
        menu.addEventListener("mouseover", (items) => {
          var target = items.currentTarget;
          target.querySelectorAll(".menu-banner-loaded").forEach((item) => {
            var dataImgBanner = item?.dataset.imageBanner;
            var dataImgWidth = item?.dataset.width;
            var dataImgHeight = item?.dataset.height;
            var img = item.querySelector(".image-banner-loaded");
            if (img == null && width > 767 && dataImgBanner != undefined) {
              item.innerHTML = `<img 
              src=${dataImgBanner} 
              alt="Menu banner" 
              srcset="${dataImgBanner}&amp;width=375 375w, ${dataImgBanner}&amp;width=550 550w, ${dataImgBanner}&amp;width=750 750w, ${dataImgBanner}&amp;width=1100 1100w, ${dataImgBanner}&amp;width=1500 1500w, ${dataImgBanner}&amp;width=1780 1780w, ${dataImgBanner}&amp;width=2000 2000w, ${dataImgBanner}&amp;width=3000 3000w, ${dataImgBanner}&amp;width=3840 3840w" 
              sizes="100vw",
              class="image-banner-loaded"
              loading="lazy"
              width="${dataImgWidth}"
              height="${dataImgHeight}"
            >`;
            }
          });
        });
      });
    },
  };
})();
TpsMainMenuShopify.init();

var TpsSearchShopify = (function () {
  return {
    init: function () {
      var predictive = document.querySelector("#predictive-search");
      if (predictive) {
        this.setupEventListeners();
      }
      const form = document.querySelector("#search-form");
      document.querySelectorAll(".top-search-toggle").forEach((navToggle) => {
        navToggle.addEventListener("click", () => {
          if (!form.classList.contains("tps__opend-popup-header")) {
            form.classList.add("tps__opend-popup-header");
            document.documentElement.classList.add("hside_opened");
            document.documentElement.classList.add("open-search");
            setTimeout(function () {
              form.querySelector('input[type="search"]').focus();
            }, 100);
          } else {
            form.classList.remove("tps__opend-popup-header");
            document.documentElement.classList.remove("hside_opened");
            document.documentElement.classList.remove("open-search");
          }
        });
      });
      document
        .querySelectorAll(".mini_search_header .button-close")
        .forEach((navToggle) => {
          navToggle.addEventListener("click", () => {
            form.classList.remove("tps__opend-popup-header");
            document.documentElement.classList.remove("hside_opened");
            document.documentElement.classList.remove("open-search");
          });
        });
      const sf = document.querySelector(".search-full");
      if (sf) {
        const hs = sf.closest(".header_search");
        document.addEventListener("click", (e) => {
          const ehs = e.target.closest(".header_search");
          if (!ehs) {
            if (hs) {
              const ps = hs.querySelector(".popup-search");
              ps.classList.remove("popup-search-show");
            }
          } else {
            const ps = ehs.querySelector(".popup-search");
            ps.classList.add("popup-search-show");
            if (e.target && e.target.classList.contains("popup-search-show")) {
              ps.classList.remove("popup-search-show");
            }
          }
        });
      }
    },
    setupEventListeners: function () {
      const input = document.querySelector('input[type="search"]');
      const form = document.querySelector("form.search");
      form.addEventListener("submit", this.onFormSubmit.bind(this));
      input.addEventListener(
        "input",
        this.debounce((event) => {
          this.onChange(event);
        }, 300).bind(this)
      );
      input.addEventListener("focus", this.onFocus.bind(this));
      document.addEventListener("focusout", this.onFocusOut.bind(this));
      document.addEventListener("keyup", this.onKeyup.bind(this));
      document.addEventListener("keydown", this.onKeydown.bind(this));
      document
        .querySelectorAll('.select_cat [data-name="product_type"] li')
        .forEach((product_type) => {
          product_type.addEventListener("click", (e) => {
            const target = e.currentTarget;
            if (target.classList.contains("active")) {
              return;
            } else {
              for (var item of document.querySelectorAll(
                '.select_cat [data-name="product_type"] li'
              )) {
                item.classList.remove("active");
              }
              target.classList.add("active");
              document
                .querySelector("#search_mini_form")
                .querySelector('[name="category"]').value =
                target.getAttribute("data-value");
              this.onChange();
            }
          });
        });
    },

    debounce: function (fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    },

    getQuery: function () {
      return document.querySelector('input[type="search"]').value.trim();
    },

    onChange: function () {
      const searchTerm = this.getQuery();
      if (!searchTerm.length) {
        this.close(true);
        return;
      }
      this.getSearchResults(searchTerm);
    },

    onFormSubmit: function (event) {
      if (
        !this.getQuery().length ||
        this.querySelector('[aria-selected="true"] a')
      )
        event.preventDefault();
    },

    onFocus: function () {
      const searchTerm = this.getQuery();
      if (!searchTerm.length) return;
      if (
        document
          .querySelector("#predictive-search")
          .classList.contains("results")
      ) {
        this.open();
      } else {
        this.getSearchResults(searchTerm);
      }
    },

    onFocusOut: function () {
      setTimeout(() => {
        if (!document.contains(document.activeElement)) this.close();
      });
    },

    onKeyup: function (event) {
      if (!this.getQuery().length) this.close(true);
      event.preventDefault();

      switch (event.code) {
        case "ArrowUp":
          this.switchOption("up");
          break;
        case "ArrowDown":
          this.switchOption("down");
          break;
        case "Enter":
          this.selectOption();
          break;
      }
    },

    onKeydown: function (event) {
      if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
      }
    },

    switchOption: function (direction) {
      if (!this.getAttribute("open")) return;
      const moveUp = direction === "up";
      const selectedElement = document.querySelector('[aria-selected="true"]');
      const allElements = document.querySelectorAll("li");
      let activeElement = document.querySelector("li");

      if (moveUp && !selectedElement) return;

      this.statusElement.textContent = "";

      if (!moveUp && selectedElement) {
        activeElement = selectedElement.nextElementSibling || allElements[0];
      } else if (moveUp) {
        activeElement =
          selectedElement.previousElementSibling ||
          allElements[allElements.length - 1];
      }

      if (activeElement === selectedElement) return;

      activeElement.setAttribute("aria-selected", true);
      if (selectedElement) selectedElement.setAttribute("aria-selected", false);
      document
        .querySelector('input[type="search"]')
        .setAttribute("aria-activedescendant", activeElement.id);
    },

    selectOption: function () {
      const selectedProduct = document.querySelector(
        '[aria-selected="true"] a, [aria-selected="true"] button'
      );

      if (selectedProduct) selectedProduct.click();
    },

    getSearchResults: function (searchTerm) {
      const cachedResults = {};
      const queryKey = searchTerm.replace(" ", "-").toLowerCase();
      this.setLiveRegionLoadingState();
      if (cachedResults[queryKey]) {
        this.renderSearchResults(cachedResults[queryKey]);
        return;
      }
      if (document.querySelector(".search_type_popup")) {
        var section_id = "search-predictive-grid";
      } else {
        var section_id = "search-predictive-list";
      }
      if (document.querySelector(".predictive_search_suggest")) {
        var search_url = `${
          routes.predictive_search_url
        }?q=${encodeURIComponent(
          searchTerm
        )}&resources[options][fields]=title,tag,vendor,product_type,variants.title,variants.sku&resources[options][prefix]=last&resources[options][unavailable_products]=last&resources[type]=product&resources[limit]=6&section_id=${section_id}`;
      } else {
        var search_url = `${routes.search_url}?q=${encodeURIComponent(
          searchTerm
        )}&options[prefix]=last&options[unavailable_products]=last&type=product&limit=6&section_id=${section_id}`;
      }
      fetch(`${search_url}`)
        .then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            this.close();
            throw error;
          }
          return response.text();
        })
        .then((text) => {
          const resultsMarkup = new DOMParser()
            .parseFromString(text, "text/html")
            .querySelector("#shopify-section-" + section_id + "").innerHTML;
          cachedResults[queryKey] = resultsMarkup;
          this.renderSearchResults(resultsMarkup);
          TpsColorSwatchesShopify.init();
          TpsLazyloadImg.init();
        })
        .catch((error) => {
          this.close();
          throw error;
        });
    },

    setLiveRegionLoadingState: function () {
      document.querySelector("#search_mini_form").classList.add("loading");
      document.querySelector("#predictive-search").classList.add("loading");
    },

    setLiveRegionResults: function () {
      document.querySelector("#search_mini_form").classList.remove("loading");
      document.querySelector("#predictive-search").classList.remove("loading");
    },

    renderSearchResults: function (resultsMarkup) {
      document.querySelector("[data-predictive-search]").innerHTML =
        resultsMarkup;
      document.querySelector("#predictive-search").classList.add("results");
      const quick_search = document.querySelector("#quick-search");
      if (quick_search) {
        quick_search.classList.add("d-none");
      }
      this.setLiveRegionResults();
      this.open();
    },

    open: function () {
      document
        .querySelector('input[type="search"]')
        .setAttribute("aria-expanded", true);
      this.isOpen = true;
    },

    close: function (clearSearchTerm = false) {
      if (clearSearchTerm) {
        document.querySelector('input[type="search"]').value = "";
        document
          .querySelector("#predictive-search")
          .classList.remove("results");
        const quick_search = document.querySelector("#quick-search");
        if (quick_search) {
          quick_search.classList.remove("d-none");
        }
      }
      const selected = document.querySelector('[aria-selected="true"]');
      if (selected) selected.setAttribute("aria-selected", false);
      document
        .querySelector('input[type="search"]')
        .setAttribute("aria-activedescendant", "");
      document
        .querySelector('input[type="search"]')
        .setAttribute("aria-expanded", false);
      this.resultsMaxHeight = false;
      document
        .querySelector("[data-predictive-search]")
        .removeAttribute("style");
      this.isOpen = false;
    },
  };
})();
TpsSearchShopify.init();

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");
      }

      onSubmitHandler(evt) {
        evt.preventDefault();

        this.handleErrorMessage();

        const config = fetchConfig("json");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData(this.form);
        const bpdi = this.form.closest(".tps__product-details-infor");
        if (bpdi) {
          bpdi.querySelectorAll("product-property").forEach((property) => {
            const input = property.querySelector("input");
            if (input.classList.contains("file") && input.files[0]) {
              formData.append(input.name, input.files[0]);
            } else if (input.classList.contains("text") && input.value) {
              formData.append(input.name, input.value);
            }
          });
        }
        this.submitButton.setAttribute("disabled", true);
        this.submitButton.classList.add("btn-loading");
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            this.submitButton.setAttribute("disabled", true);
            this.submitButton.querySelector("span").classList.add("hidden");
            fetch("/cart.json")
              .then((res) => res.json())
              .then((cart) => {
                document
                  .querySelectorAll(".tp-header-action-badge")
                  .forEach((el) => {
                    el.innerHTML = cart.item_count;
                  });
                if (document.querySelector("header-total-price")) {
                  document
                    .querySelector("header-total-price")
                    .updateTotal(cart);
                }
              })
              .catch((error) => {
                throw error;
              });
            const parsedState = JSON.parse(state);
            if (!parsedState.errors) {
              this.cart.getSectionsToRender().forEach((section) => {
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
                const countdown = this.cart.querySelector(
                  ".cart-countdown-time"
                );
                const html_countdown = html.querySelector(
                  ".cart-countdown-time"
                );
                if (countdown && html_countdown) {
                  countdown.innerHTML = html_countdown.innerHTML;
                  this.cart.countdownTimer();
                }
              });
              if (this.closest(".dlg")) {
                document.querySelector(".dlg-close-x").click();
              }
              this.cart.cartAction();
              this.cart.open();
            } else {
              const content = document.querySelector(
                ".form-infor .add-cart-error"
              );
              if (!content) return;
              let quickview = EasyDialogBox.getById("qvdialog_0");
              let add_cart_view = EasyDialogBox.getById(
                "dlg-product-quickview_0"
              );
              if (quickview) {
                quickview.onHide = quickview.destroy;
                quickview.hide();
              }
              if (add_cart_view) {
                add_cart_view.onHide = add_cart_view.destroy;
                add_cart_view.hide();
              }
              var error_message = EasyDialogBox.create(
                "add_cart_error",
                "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                "",
                content.innerHTML
              );
              error_message.onClose = error_message.destroy;
              error_message.show();
            }
          })
          .catch((e) => {
            throw e;
          })
          .finally(() => {
            this.submitButton.classList.remove("btn-loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("disabled");
            this.submitButton.querySelector("span").classList.remove("hidden");
            Shopify.termsConditionsAction();
            TpsLazyloadImg.init();
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.currentTarget.name === "plus"
      ? this.input.stepUp()
      : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }
}
customElements.define("quantity-input", QuantityInput);

class LocalizationForm extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      input: this.querySelector(
        'input[name="language_code"], input[name="country_code"]'
      ),
      button: this.querySelector(".button-localization"),
      panel: this.querySelector("ul"),
    };
    this.elements.button.addEventListener(
      "click",
      this.openSelector.bind(this)
    );
    this.elements.button.addEventListener(
      "focusout",
      this.closeSelector.bind(this)
    );
    this.addEventListener("keyup", this.onContainerKeyUp.bind(this));
    this.querySelectorAll("a").forEach((item) =>
      item.addEventListener("click", this.onItemClick.bind(this))
    );
    this.onBodyClick = this.handleBodyClick.bind(this);
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target != this && !target.closest("localization-form")) {
      this.hidePanel();
    }
  }

  hidePanel() {
    document.body.removeEventListener("click", this.onBodyClick);
    this.elements.button.classList.remove("opend");
    this.elements.panel.classList.add("hidden");
  }

  onContainerKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;
    this.hidePanel();
    this.elements.button.focus();
  }

  onItemClick(event) {
    event.preventDefault();
    const form = this.querySelector("form");
    this.elements.input.value = event.currentTarget.dataset.value;
    if (form) form.submit();
  }

  openSelector() {
    if (this.elements.button.classList.contains("opend")) {
      this.hidePanel();
    } else {
      document.body.addEventListener("click", this.onBodyClick);
      this.elements.button.focus();
      for (var item of document.querySelectorAll(".button-localization")) {
        item.classList.remove("opend");
      }
      for (var item of document.querySelectorAll(".disclosure__list")) {
        item.classList.add("hidden");
      }
      this.elements.button.classList.add("opend");
      this.elements.panel.classList.remove("hidden");
    }
  }

  closeSelector(event) {
    const shouldClose =
      event.relatedTarget && event.relatedTarget.nodeName === "BUTTON";
    if (event.relatedTarget === null || shouldClose) {
      this.hidePanel();
    }
  }
}
customElements.define("localization-form", LocalizationForm);

class CartNotification extends HTMLElement {
  constructor() {
    super();
    this.notification = document.getElementById("tps-header_minicart");
    this.giftwrap = document.querySelector(".tps__add-giftwrap");
    this.cartCountDown = document.querySelector(".cart-countdown-time");
    this.startTime = Date.now();
    this.querySelectorAll(".tps-minicart-wrapper .close-button").forEach(
      (closeButton) =>
        closeButton.addEventListener("click", this.close.bind(this))
    );
    document
      .querySelectorAll(".tps-minicart-action", ".close-cart")
      .forEach((navToggle) => {
        navToggle.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            if (
              this.notification.classList.contains("tps__opend-popup-header")
            ) {
              this.close();
            } else {
              this.open();
            }
          },
          false
        );
      });
    this.currentItemCount = Array.from(
      this.querySelectorAll('[name="updates[]"]')
    ).reduce(
      (total, quantityInput) => total + parseInt(quantityInput.value),
      0
    );

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);
    this.addEventListener("change", this.debouncedOnChange.bind(this));
    this.cartAction();
    this.countdownTimer();
    this.addonsUpdate();
  }

  cartAction() {
    document.querySelectorAll(".close-cart").forEach((navToggle) => {
      navToggle.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          if (this.notification.classList.contains("tps__opend-popup-header")) {
            this.close();
          }
        },
        false
      );
    });
    document.querySelectorAll(".tps__cart-addons button").forEach((button) => {
      button.removeEventListener("click", this.cartAddons.bind(this), false);
      button.addEventListener("click", this.cartAddons.bind(this), false);
    });

    document
      .querySelectorAll(".tps__addon-actions .btn-save")
      .forEach((button) => {
        button.removeEventListener(
          "click",
          this.cartAddonsSave.bind(this),
          false
        );
        button.addEventListener("click", this.cartAddonsSave.bind(this), false);
      });

    document.querySelectorAll(".tps__add-giftwrap").forEach((giftwrap) => {
      giftwrap.removeEventListener(
        "click",
        this.addGiftwrapClick.bind(this),
        false
      );
      giftwrap.addEventListener(
        "click",
        this.addGiftwrapClick.bind(this),
        false
      );
    });

    document.querySelectorAll(".tps-minicart-item-edit").forEach((edit) => {
      edit.removeEventListener("click", this.cartEditItem.bind(this), false);
      edit.addEventListener("click", this.cartEditItem.bind(this), false);
    });

    const conditions = document.getElementById("conditions_form_minicart");
    if (conditions) {
      conditions.addEventListener("change", (event) => {
        if (event.currentTarget.checked) {
          document
            .querySelector(".tps-btn-checkout")
            .removeAttribute("disabled");
        } else {
          document
            .querySelector(".tps-btn-checkout")
            .setAttribute("disabled", "disabled");
        }
      });
    }

    document
      .querySelectorAll(".tps__addon-actions .btn-cancel")
      .forEach((addonCancel) => {
        addonCancel.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            target.closest(".tps__addon").classList.remove("is-open");
            target
              .closest(".tps-minicart-wrapper")
              .classList.remove("addons-open");
          },
          false
        );
      });

    document
      .querySelectorAll(".tps__addon-actions .btn-cancel")
      .forEach((addonCancel) => {
        addonCancel.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            const target = e.currentTarget;
            target.closest(".tps__addon").classList.remove("is-open");
            target
              .closest(".tps-minicart-wrapper")
              .classList.remove("addons-open");
          },
          false
        );
      });
  }

  addonsUpdate() {
    const address_country = document.getElementById("address_country");
    const address_province = document.getElementById("address_province");
    if (address_country && address_province) {
      new Shopify.CountryProvinceSelector(
        "address_country",
        "address_province",
        { hideElement: "address_province_container" }
      );
    }

    const tps__discount_code = document.querySelector(".tps__discount_code");
    const code = localStorage.getItem("discount_code");
    if (code && tps__discount_code) {
      document.querySelector(".tps__discount_code").value = code;
    }
  }

  cartAddons(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const open = target.getAttribute("data-open");
    if (
      !document.getElementById("tps__" + open).classList.contains("is-open")
    ) {
      document.getElementById("tps__" + open).classList.add("is-open");
      target.closest(".tps-minicart-wrapper").classList.add("addons-open");
      if (open == "shipping") {
        const address_country = document.getElementById("address_country");
        const address_province = document.getElementById("address_province");
        if (address_country && address_province) {
          new Shopify.CountryProvinceSelector(
            "address_country",
            "address_province",
            { hideElement: "address_province_container" }
          );
        }
      }
    } else {
      document.getElementById("tps__" + open).classList.remove("is-open");
      target.closest(".tps-minicart-wrapper").classList.remove("addons-open");
    }
  }

  cartEditItem(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const key = target.getAttribute("data-key");
    const quantity = target.getAttribute("data-quantity");
    const href = target.getAttribute("href");
    const variant =
      href.indexOf("?") > -1 ||
      href.indexOf("?variant=") > -1 ||
      href.indexOf("&variant=") > -1
        ? "&"
        : "/?";
    target.closest(".cart-item").classList.add("loadding");
    fetch(`${window.shopUrl}${href}${variant}section_id=cart-quick-edit`)
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          throw error;
        }
        return response.text();
      })
      .then((response) => {
        const resultsMarkup = new DOMParser()
          .parseFromString(response, "text/html")
          .getElementById("shopify-section-cart-quick-edit");
        var quick_edit = EasyDialogBox.create(
          "cart-edit-item",
          "dlg dlg-disable-footer dlg-disable-drag",
          cartStrings.quick_edit,
          resultsMarkup.innerHTML
        );
        quick_edit.onClose = quick_edit.destroy;
        quick_edit.show();
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        if (document.querySelector("[data-template-quick-cart-edit]")) {
          document
            .querySelector("[data-template-quick-cart-edit]")
            .setAttribute("data-line", key);
        }
        if (
          document.querySelector(
            ".product-form-quick-edit quantity-input input"
          )
        ) {
          document.querySelector(
            ".product-form-quick-edit quantity-input input"
          ).value = quantity;
        }
        target.closest(".cart-item").classList.remove("loadding");
        TpsColorSwatchesShopify.init();
        TpsLazyloadImg.init();
      });
  }

  cartAddonsSave(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const action = target.getAttribute("data-action");
    if (action == "coupon") {
      const value = document.querySelector(".tps__discount_code").value;
      localStorage.setItem("discount_code", value);
      document.getElementById("tps__" + action).classList.remove("is-open");
      document
        .querySelector(".tps-minicart-wrapper")
        .closest(".tps-minicart-wrapper")
        .classList.remove("addons-open");
    } else if (action == "note") {
      const body = JSON.stringify({
        note: document.querySelector(".tps__cart-note").value,
      });
      fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
      document.getElementById("tps__" + action).classList.remove("is-open");
      document
        .querySelector(".tps-minicart-wrapper")
        .closest(".tps-minicart-wrapper")
        .classList.remove("addons-open");
    } else if (action == "shipping") {
      var e = {};
      (e.zip = document.querySelector("#AddressZip").value || ""),
        (e.country = document.querySelector("#address_country").value || ""),
        (e.province = document.querySelector("#address_province").value || ""),
        this._getCartShippingRatesForDestination(e);
    }
  }

  _getCartShippingRatesForDestination(event) {
    fetch(
      `${window.Shopify.routes.root}cart/shipping_rates.json?shipping_address%5Bzip%5D=${event.zip}&shipping_address%5Bcountry%5D=${event.country}&shipping_address%5Bprovince%5D=${event.province}`
    )
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const message = document.querySelector(".tps__addon-message");
        for (var item of document.querySelectorAll(".tps__addon-message p")) {
          item.remove();
        }
        const parsedState = JSON.parse(state);
        if (parsedState && parsedState.shipping_rates) {
          if (parsedState.shipping_rates.length > 0) {
            message.classList.remove("error", "warning");
            message.classList.add("success");
            const p = document.createElement("p");
            p.innerText = cartStrings.shipping_rate.replace(
              "{{address}}",
              event.zip + ", " + event.country + " " + event.province
            );
            message.appendChild(p);
            parsedState.shipping_rates.map((rate) => {
              const rateNode = document.createElement("p");
              rateNode.innerHTML =
                rate.name +
                ": " +
                Shopify.formatMoney(rate.price, cartStrings.money_format);
              message.appendChild(rateNode);
            });
          } else {
            message.classList.remove("error", "success");
            message.classList.add("warning");
            const p = document.createElement("p");
            p.innerText = cartStrings.no_shipping;
            message.appendChild(p);
          }
        } else {
          message.classList.remove("success", "warning");
          message.classList.add("error");
          Object.entries(parsedState).map((error) => {
            const message_error = `${error[1][0]}`;
            const p = document.createElement("p");
            p.innerText = message_error;
            message.appendChild(p);
          });
        }
      })
      .catch((error) => {
        throw error;
      });
  }

  addGiftwrapClick(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const variant_id = target.getAttribute("data-variant-id");
    const config = fetchConfig("json");
    config.body = JSON.stringify({
      id: Number(variant_id),
      quantity: 1,
      sections: this.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname,
    });
    target.classList.add("loading");
    fetch(`${routes.cart_add_url}`, config)
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
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
        this.getSectionsToRender().forEach((section) => {
          const elementToReplace = document.getElementById(section.id);
          const html = new DOMParser().parseFromString(
            parsedState.sections[section.id],
            "text/html"
          );
          elementToReplace.innerHTML =
            html.querySelector("#form-mini-cart").innerHTML;
          const cart_threshold = document.querySelector(".tps__cart-thres-js");
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
        });
        this.cartAction();
      })
      .catch((e) => {
        throw e;
      })
      .finally(() => {
        document
          .querySelector(".tps__add-giftwrap")
          .classList.remove("loading");
        document.getElementById("tps__gift").classList.remove("is-open");
        document
          .querySelector(".tps-minicart-wrapper")
          .classList.remove("addons-open");
        Shopify.termsConditionsAction();
        TpsLazyloadImg.init();
      });
  }

  onChange(event) {
    if (event.target.getAttribute("name") == "updates[]")
      this.updateQuantity(
        event.target.dataset.id,
        event.target.value,
        document.activeElement.getAttribute("name")
      );
  }

  updateQuantity(id, quantity, name) {
    quantity = quantity ? quantity : 0;
    const body = JSON.stringify({
      id,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname,
    });
    this.notification.classList.add("start", "loading");
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        document.querySelectorAll(".cart-count").forEach((el) => {
          el.innerHTML = parsedState.item_count;
        });
        if (document.querySelector("header-total-price")) {
          document.querySelector("header-total-price").updateTotal(parsedState);
        }
        if (parsedState.item_count == 0 && this.cartCountDown) {
          this.cartCountDown.querySelector(".countdown-message").remove();
        }
        this.getSectionsToRender().forEach((section) => {
          const elementToReplace = document.getElementById(section.id);
          const html = new DOMParser().parseFromString(
            parsedState.sections[section.id],
            "text/html"
          );
          elementToReplace.innerHTML =
            html.querySelector("#form-mini-cart").innerHTML;
          const cart_threshold = document.querySelector(".tps__cart-thres-js");
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
        });
        this.cartAction();
      })
      .catch((e) => {
        throw e;
      })
      .finally(() => {
        Shopify.termsConditionsAction();
        this.notification.classList.add("finish");
        setTimeout(function () {
          this.cart = document.querySelector("cart-notification");
          this.cart
            .querySelector(".header_minicart")
            .classList.remove("start", "loading", "finish");
        }, 500);
        TpsLazyloadImg.init();
      });
  }

  countdownTimer() {
    if (!this.cartCountDown) return;
    const duration = Number(this.cartCountDown.dataset.countdownTime) || 5;
    const message = this.cartCountDown.dataset.timeoutMessage;
    const endTime = this.startTime + duration * 60 * 1000;
    const countdown_timer = setInterval(() => {
      if (!document.querySelector(".cart-countdown-time .countdown-message")) {
        clearInterval(countdown_timer);
      } else {
        if (this.startTime > endTime) {
          this.cartCountDown.querySelector(".countdown-message").innerHTML =
            message;
          clearInterval(countdown_timer);
        } else {
          var distance = endTime - this.startTime;
          var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          var seconds = Math.floor((distance % (1000 * 60)) / 1000);
          document.querySelector(".countdown-timer-minute").innerHTML = minutes;
          document.querySelector(".countdown-timer-sec").innerHTML = seconds;
        }
        this.startTime += 1000;
      }
    }, 1000);
  }

  open() {
    // this.notification.classList.add("cartmini-open-btn");
    // document.documentElement.classList.add("hside_opened");
    // this.notification.addEventListener(
    //   "transitionend",
    //   () => {
    //     this.notification.focus();
    //   },
    //   { once: true }
    // );
    // document.body.addEventListener("click", this.onBodyClick);
    document.querySelector(".tp-header-action-btn").click();
  }

  close() {
    this.notification.classList.remove("tps__opend-popup-header");
    document.documentElement.classList.remove("hside_opened");
    document.body.removeEventListener("click", this.onBodyClick);
    for (var item of document.querySelectorAll(".tps__addon")) {
      item.classList.remove("is-open");
    }
    for (var item of document.querySelectorAll(".tps-minicart-wrapper")) {
      item.classList.remove("addons-open");
    }
  }

  getSectionsToRender() {
    return [
      {
        id: "form-mini-cart",
      },
    ];
  }

  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser()
      .parseFromString(html, "text/html")
      .querySelector(selector).innerHTML;
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define("cart-notification", CartNotification);

class MiniCartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("cart-notification");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define("mini-cart-remove-button", MiniCartRemoveButton);

class VariantSelectsQuickEdit extends HTMLElement {
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
    this.options = Array.from(
      this.querySelectorAll(".tps__option-swatch.active"),
      (select) => select.getAttribute("data-value")
    );
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateVariantInput();
      this.renderProductInfo();
    }
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
    const form = document.getElementById(
      `product-form-quick-edit-${this.dataset.section}`
    );
    form.querySelector(".product__media img").removeAttribute("srcset");
    form
      .querySelector(".product__media img")
      .setAttribute(
        "src",
        this.currentVariant.featured_media.preview_image.src
      );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-quick-edit-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  renderProductInfo() {
    if (!this.currentVariant) return;
    const compare_at_price = this.currentVariant.compare_at_price;
    const price = this.currentVariant.price;
    const price_format = Shopify.formatMoney(
      this.currentVariant.price,
      cartStrings.money_format
    );
    const form = document.getElementById(
      `product-form-quick-edit-${this.dataset.section}`
    );
    form.querySelector(".price__regular .price").innerHTML = price_format;
    const tps__price = form.querySelector(".tps__price");
    tps__price.classList.remove("price--sold-out", "price--on-sale");
    tps__price
      .querySelector(".price__regular .price")
      .classList.remove("special-price");
    if (compare_at_price && compare_at_price > price) {
      const compare_format = Shopify.formatMoney(
        compare_at_price,
        cartStrings.money_format
      );
      if (!tps__price.querySelector(".compare-price")) {
        var ps = tps__price.querySelector(".price__sale");
        var sp = document.createElement("span");
        var cp = document.createElement("s");
        cp.classList.add("price-item", "compare-price");
        sp.appendChild(cp);
        if (ps) {
          ps.appendChild(sp);
        }
      }
      if (tps__price.querySelector(".compare-price")) {
        tps__price.querySelector(".compare-price").innerHTML = compare_format;
      }
      tps__price.classList.add("price--on-sale");
      tps__price
        .querySelector(".price__regular .price")
        .classList.add("special-price");
    } else if (!this.currentVariant.available) {
      tps__price.classList.add("price--sold-out");
    }
    this.toggleAddButton(
      !this.currentVariant.available,
      window.variantStrings.soldOut
    );
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-quick-edit-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const addButtonText = productForm.querySelector('[name="add"] > span');
    if (!addButton) return;

    if (disable) {
      addButton.setAttribute("disabled", "disabled");
      if (text) addButtonText.textContent = text;
    } else {
      addButton.removeAttribute("disabled");
      addButtonText.textContent = window.variantStrings.addToCart;
    }

    if (!modifyClass) return;
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-quick-edit-${this.dataset.section}`
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
}
customElements.define("variant-radios-quick-edit", VariantSelectsQuickEdit);

if (!customElements.get("product-form-quick-edit")) {
  customElements.define(
    "product-form-quick-edit",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        this.handleErrorMessage();
        this.submitButton.setAttribute("disabled", true);
        this.submitButton.classList.add("btn-loading");
        const quick = document.getElementById("product-form-quick-edit");
        const id = quick.getAttribute("data-line");
        const quantity = 0;
        const config_change = fetchConfig("json");
        config_change.body = JSON.stringify({
          id,
          quantity,
        });
        fetch(`${routes.cart_change_url}`, config_change)
          .then((response) => {
            return response.text();
          })
          .catch((e) => {
            throw e;
          })
          .finally(() => {
            this.addCartAdd();
          });
      }

      addCartAdd() {
        const config = fetchConfig("json");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];
        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;
        fetch(`${routes.cart_add_url}`, config)
          .then((response) => {
            return response.text();
          })
          .then((state) => {
            this.submitButton.setAttribute("disabled", true);
            this.submitButton.querySelector("span").classList.add("hidden");
            fetch("/cart.json")
              .then((res) => res.json())
              .then((cart) => {
                document.querySelectorAll(".cart-count").forEach((el) => {
                  el.innerHTML = cart.item_count;
                });
                if (document.querySelector("header-total-price")) {
                  document
                    .querySelector("header-total-price")
                    .updateTotal(cart);
                }
              })
              .catch((error) => {
                throw error;
              });
            const parsedState = JSON.parse(state);
            if (!parsedState.errors) {
              this.cart.getSectionsToRender().forEach((section) => {
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
                const countdown = this.cart.querySelector(
                  ".cart-countdown-time"
                );
                const html_countdown = html.querySelector(
                  ".cart-countdown-time"
                );
                if (countdown && html_countdown) {
                  countdown.innerHTML = html_countdown.innerHTML;
                  this.cart.countdownTimer();
                }
              });
              this.cart.cartAction();
              document.querySelector(".dlg-close-x").click();
            } else {
              const content = document.querySelector(
                ".form-infor .add-cart-error"
              );
              if (!content) return;
              var error_message = EasyDialogBox.create(
                "add_cart_error",
                "dlg dlg-disable-footer dlg-disable-drag dlg-disable-heading",
                "",
                content.innerHTML
              );
              let cart_quick_edit = EasyDialogBox.getById("cart-edit-item_0");
              if (cart_quick_edit) {
                cart_quick_edit.onHide = cart_quick_edit.destroy;
                cart_quick_edit.hide();
              }
              error_message.onClose = error_message.destroy;
              error_message.show();
            }
          })
          .catch((e) => {
            throw e;
          })
          .finally(() => {
            this.submitButton.classList.remove("btn-loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) this.submitButton.removeAttribute("disabled");
            this.submitButton.querySelector("span").classList.remove("hidden");
            Shopify.termsConditionsAction();
            TpsLazyloadImg.init();
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}

class VariantRadiosQuickview extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll(".tps__option-swatch").forEach((button) =>
      button.addEventListener("click", this.onVariantChange.bind(this), false)
    );
    this.actionDropdownSwatches();
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
    this.options = Array.from(
      this.querySelectorAll(".tps__option-swatch.active"),
      (select) => select.getAttribute("data-value")
    );
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateVariantInput();
      this.renderProductInfo();
    }
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

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      if (input) {
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  renderProductInfo() {
    if (!this.currentVariant) return;
    let qty = 0;
    let percent = 0;
    let sale = false;
    let availability = window.variantStrings.inStock;
    let variantStrings = window.variantStrings.soldOut;
    const compare_at_price = this.currentVariant.compare_at_price;
    const price = this.currentVariant.price;
    const unit_price = this.currentVariant.unit_price;
    const unit_price_measurement = this.currentVariant.unit_price_measurement;
    const form = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const quickview = form.closest(".tps__product-quickview");
    this.getVariantQtyData().find((variantQty) => {
      if (variantQty.id === this.currentVariant.id) {
        qty = variantQty.qty;
      }
    });
    if (compare_at_price && compare_at_price > price) {
      sale = true;
      percent = ((compare_at_price - price) / compare_at_price) * 100;
    }
    if (this.currentVariant.available && qty < 1) {
      availability = window.variantStrings.preOrder;
      variantStrings = window.variantStrings.preOrder;
    } else if (!this.currentVariant.available) {
      availability = window.variantStrings.outStock;
    } else {
      availability = window.variantStrings.inStock;
      variantStrings = window.variantStrings.addToCart;
    }
    if (this.currentVariant.inventory_management === null) {
      availability = window.variantStrings.inStock;
      variantStrings = window.variantStrings.addToCart;
    }
    if (quickview.querySelector(".tps__availability-value")) {
      quickview.querySelector(".tps__availability-value").textContent =
        availability;
    }
    const product_label = quickview.querySelector(".tps__product-label");
    if (product_label) {
      product_label.remove();
    }
    if (sale) {
      var element = document.createElement("div");
      element.classList.add(
        "tps__product-label",
        "mb-5",
        "fs-12",
        "pointer-events-none",
        "inline-block",
        "static"
      );
      quickview
        .querySelector(".tps__quickview-content")
        .insertBefore(
          element,
          quickview.querySelector(".tps__quickview-content").children[0]
        );
      const label = quickview.querySelector(".tps__product-label");
      var element_sale = document.createElement("div");
      element_sale.classList.add("tps__sale-label");
      element_sale.innerText = -percent.toFixed(0) + "%";
      if (label) {
        label.appendChild(element_sale);
      }
    }

    if (quickview.querySelector(".tps__product-sku-value")) {
      quickview.querySelector(".tps__product-sku-value").textContent =
        this.currentVariant.sku;
    }

    const price_format = Shopify.formatMoney(
      this.currentVariant.price,
      cartStrings.money_format
    );
    if (unit_price && unit_price_measurement) {
      const price_num = Shopify.formatMoney(
        unit_price,
        cartStrings.money_format
      );
      const price_unit =
        unit_price_measurement.reference_value != 1
          ? unit_price_measurement.reference_value
          : unit_price_measurement.reference_unit;
      const upn = quickview.querySelector(".unit-price .number");
      const upu = quickview.querySelector(".unit-price .unit");
      if (upn) {
        upn.innerHTML = price_num;
      }
      if (upu) {
        upu.innerHTML = price_unit;
      }
    }
    const upp = quickview.querySelector(".price__regular .price");
    if (upp) {
      upp.innerHTML = price_format;
    }

    const stockNotify = quickview.querySelector(".product-notify-stock");
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

    const tps__price = quickview.querySelector(".tps__price");
    tps__price.classList.remove("price--sold-out", "price--on-sale");
    tps__price
      .querySelector(".price__regular .price")
      .classList.remove("special-price");
    if (compare_at_price && compare_at_price > price) {
      const compare_format = Shopify.formatMoney(
        compare_at_price,
        cartStrings.money_format
      );
      if (!tps__price.querySelector(".compare-price")) {
        var ps = tps__price.querySelector(".price__sale");
        var sp = document.createElement("span");
        var cp = document.createElement("s");
        cp.classList.add("price-item", "compare-price");
        sp.appendChild(cp);
        if (ps) {
          ps.appendChild(sp);
        }
      }
      if (tps__price.querySelector(".compare-price")) {
        tps__price.querySelector(".compare-price").innerHTML = compare_format;
      }
      tps__price.classList.add("price--on-sale");
      tps__price
        .querySelector(".price__regular .price")
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
    alert("add button text", addButtonText);
    if (!addButton) return;
    if (disable) {
      addButton.setAttribute("disabled", "disabled");
    } else {
      addButton.removeAttribute("disabled");
    }
    if (text) addButtonText.textContent = text;

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
  actionDropdownSwatches() {
    this.querySelectorAll("[data-swatches-value]").forEach((items) => {
      items.addEventListener(
        "click",
        (e) => {
          const target = e.currentTarget;
          if (
            !target
              .closest(".tps__color-dropdown")
              .classList.contains("isClicked")
          ) {
            for (var item of this.querySelectorAll(".tps__color-dropdown")) {
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
    this.querySelectorAll(".tps__product-color-swatches-dropdown").forEach(
      (swatches) => {
        swatches.addEventListener("click", (e) => {
          const target = e.currentTarget;
          const valueSwatch = target.dataset.value;
          const container = target.closest(".tps__color-dropdown");
          container.querySelector(
            ".tps__color-dropdown-action .tps__color-dropdown-value"
          ).innerHTML = valueSwatch;
          target.closest(".tps__color-dropdown").classList.remove("isClicked");
        });
      }
    );
  }
  getVariantQtyData() {
    this.variantQtyData = JSON.parse(
      this.querySelector(".productVariantsQty").textContent
    );
    return this.variantQtyData;
  }
}
customElements.define("variant-radios-quickview", VariantRadiosQuickview);

var TpsUminoAdminLi = (function () {
  return {
    init: function () {
      this.TpsCheckLi();
    },
    TpsCheckLi: function () {
      const _this = this;
      if (typeof shofy_app === "object") {
        if (shofy_app.mode === "admin") {
          if (shofy_app.action === "active") {
            if (_this.checkCookie(shofy_app.lic) === false) {
              _this.TpsActive();
            }
          } else {
            const url =
              "https://shopifyapi.blueskytechco.com/api/remove-license/?code=" +
              shofy_app.lic +
              "&domain=" +
              shofy_app.shop;
            fetch(url)
              .then((response) => response.json())
              .then((responseText) => {
                if (responseText) {
                  const d = new Date(new Date().getTime() - 36e6);
                  _this.setCookie(shofy_app.lic, d);
                }
                _this.TpsRenderHtml(0);
              })
              .catch((e) => {
                console.log(e);
              });
          }
        }
      } else {
        _this.TpsRenderHtml(0);
      }
    },
    TpsRenderHtml: function (cs) {
      const shop = window.location.hostname.replace(/\./g, "-");
      if (!document.querySelector("#" + "tps__" + shop)) {
        const a = document.createElement("DIV");
        const n = document.createElement("DIV");
        const b = document.createElement("h3");
        const c = document.createElement("p");
        const step2p = document.createElement("p");
        const step3p = document.createElement("p");
        const d = document.createElement("h5");
        const e = document.createElement("h5");
        const f = document.createElement("h5");
        const g = document.createElement("h5");
        const h = document.createElement("strong");
        const sp1 = document.createElement("span");
        const sp2 = document.createElement("span");
        const sp3 = document.createElement("span");
        const pca = document.createElement("a");
        const eca = document.createElement("a");
        const mail = document.createElement("a");
        const br1 = document.createElement("br");
        const br2 = document.createElement("br");
        const br3 = document.createElement("br");
        const br4 = document.createElement("br");
        const spPrice = document.createElement("span");
        const spBold1 = document.createElement("span");
        const spBold2 = document.createElement("span");
        const ecbuy = document.createElement("a");

        var text = "";
        switch (cs) {
          case 1:
            text = "This purchase was activated for another domain!!!";
            break;
          case 2:
            text = "This purchase is invalid!!!";
            break;
          default:
            text = "Welcome to Umino - Shopify Themes OS 2.0 🎉 ";
            break;
        }
        const t = document.createTextNode(text);
        const s = document.createTextNode(
          "Follow these simple steps to use Umino theme:"
        );
        const q = document.createTextNode(
          "Step 1: Add Umino theme file to your 'Online store' > 'Theme'."
        );
        const p = document.createTextNode("Step 2: Insert purchase code");
        const k = document.createTextNode("Step 3: Activate purchase code");
        const r = document.createTextNode("Recommend: Install ");
        const ec = document.createTextNode("EComposer Page Builder");
        const fao = document.createTextNode(" - FREE Add-on for Umino");
        const wh = document.createTextNode(
          "Why you need EComposer Page Builder?"
        );
        const ad1 = document.createTextNode(
          "- One more option to customize Umino layouts."
        );
        const ad2 = document.createTextNode(
          "- Provide another highly flexible editor."
        );
        const ad3 = document.createTextNode("- Especially, ");
        const ad3_3 = document.createTextNode(
          " for Umino users, we offer the "
        );
        const ad3_4 = document.createTextNode(
          " of this app (FREE 100% lifetime, save you "
        );
        const only = document.createTextNode("only");
        const partner = document.createTextNode("Theme Partner Plan");
        const price = document.createTextNode("$150");
        const ad3_2 = document.createTextNode(" every year), ");
        const plan_content = document.createTextNode(
          "contact us to upgrade your plan."
        );
        const w = document.createTextNode(
          "Go to 'Theme setting' > 'Purchase code' to insert your purchase code."
        );
        const x = document.createTextNode(
          "Go to 'Theme setting' > 'Purchase code action' and select 'Active purchase code'."
        );
        const m = document.createTextNode("👉 Get Umino purchase code");
        const ecbuy_content = document.createTextNode(
          "👉 Install EComposer Here"
        );
        const step1 = document.createElement("DIV");
        const step2 = document.createElement("DIV");
        const step3 = document.createElement("DIV");
        const recommend = document.createElement("DIV");
        pca.setAttribute("target", "_blank");
        eca.setAttribute("target", "_blank");
        ecbuy.setAttribute("target", "_blank");
        pca.setAttribute(
          "href",
          "https://themeforest.net/item/umino-multipurpose-shopify-themes-os-20/42969030"
        );
        eca.setAttribute(
          "href",
          "https://ecomposer.app/referral?ref=Blueskytechco"
        );
        mail.setAttribute("href", "mailto:the4studio.net@gmail.com");
        ecbuy.setAttribute(
          "href",
          "https://ecomposer.app/referral?ref=Blueskytechco"
        );
        eca.setAttribute("class", "link");
        mail.setAttribute("class", "link");
        pca.setAttribute("class", "popup-btn");
        ecbuy.setAttribute("class", "popup-btn ecom");
        spPrice.setAttribute("class", "ecom-price");
        spBold1.setAttribute("class", "ecom-bold");
        spBold2.setAttribute("class", "ecom-bold");
        step1.setAttribute("class", "step-1");
        step2.setAttribute("class", "step-2");
        step3.setAttribute("class", "step-3");
        pca.appendChild(m);
        ecbuy.appendChild(ecbuy_content);
        eca.appendChild(ec);
        step2p.appendChild(w);
        step3p.appendChild(x);
        b.appendChild(t);
        c.appendChild(s);
        d.appendChild(q);
        e.appendChild(p);
        f.appendChild(k);
        g.appendChild(r);
        g.appendChild(eca);
        g.appendChild(fao);
        h.appendChild(wh);
        sp1.appendChild(ad1);
        sp2.appendChild(ad2);
        sp3.appendChild(ad3);
        spBold1.appendChild(only);
        sp3.appendChild(spBold1);
        sp3.appendChild(ad3_3);
        spBold2.appendChild(partner);
        sp3.appendChild(spBold2);
        sp3.appendChild(ad3_4);
        spPrice.appendChild(price);
        sp3.appendChild(spPrice);
        sp3.appendChild(ad3_2);
        mail.appendChild(plan_content);
        sp3.appendChild(mail);
        step1.appendChild(d);
        step2.appendChild(e);
        step2.appendChild(step2p);
        step2.appendChild(pca);
        step3.appendChild(f);
        step3.appendChild(step3p);
        recommend.appendChild(g);
        recommend.appendChild(h);
        recommend.appendChild(br1);
        recommend.appendChild(sp1);
        recommend.appendChild(br2);
        recommend.appendChild(sp2);
        recommend.appendChild(br3);
        recommend.appendChild(sp3);
        recommend.appendChild(br4);
        recommend.appendChild(ecbuy);
        a.setAttribute("id", "tps__not-active");
        n.appendChild(b);
        n.appendChild(c);
        n.appendChild(step1);
        n.appendChild(step2);
        n.appendChild(step3);
        n.appendChild(recommend);
        a.appendChild(n);
        document.querySelector("body").appendChild(a);
      } else {
        document.querySelector("#" + "tps__" + shop).remove();
      }
    },
    TpsActive: function () {
      const _this = this;
      const url =
        "https://shopifyapi.blueskytechco.com/api/check-license/?code=" +
        shofy_app.lic +
        "&domain=" +
        shofy_app.shop;
      fetch(url)
        .then((response) => response.json())
        .then((responseText) => {
          if (responseText.d === false) {
            _this.TpsRenderHtml(responseText.s);
          } else if (responseText.d === true) {
            const d = new Date(new Date().getTime() + 36e6);
            _this.setCookie(shofy_app.lic, d);
          } else if (responseText.d === "err") {
            console.log(
              responseText.err
                ? responseText.err.message
                : "Please contact to server's adminstrator!!!"
            );
          }
        })
        .catch((e) => {
          console.log(e);
        });
    },
    setCookie: function (cvalue, d) {
      const v = btoa(cvalue);
      document.cookie =
        "UHVyY2hhc2VDb2Rl" + "=" + v + ";expires=" + d + ";path=/";
    },
    checkCookie: function (val) {
      const v = atob(getCookie("UHVyY2hhc2VDb2Rl"));
      if (val.length !== 0 && v == val) {
        return true;
      } else {
        return false;
      }
    },
  };
})();
TpsUminoAdminLi.init();
class InstagramShop extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll("img").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const is_shown = document.querySelector("#dlg-lookbook_0");
    if (event.currentTarget && is_shown === null) {
      var lookbook = EasyDialogBox.create(
        "dlg-lookbook",
        "dlg dlg-disable-heading dlg-disable-footer dlg-disable-drag",
        "",
        this.htmlRender(event.currentTarget).innerHTML
      );
      lookbook.onClose = lookbook.destroy;
      lookbook.show();
    }
  }

  htmlRender(ct) {
    const bli = ct.closest(".tps__lookbook-items");
    const is = ct.closest("instagram-shop");
    if (bli) {
      const id = bli.id;
      if (is) {
        const data = JSON.parse(is.querySelector(".igShopBlock").textContent);
        if (data) {
          const d = data.find((x) => x.id === id);
          const img = d.bl_img;
          const {
            ot_1,
            ol_1,
            p_1,
            ot_2,
            ol_2,
            p_2,
            ot_3,
            ol_3,
            p_3,
            ot_4,
            ol_4,
            p_4,
            ot_5,
            ol_5,
            p_5,
            cap_1,
            cap_2,
            cap_3,
            cap_4,
            p_img_1,
            p_img_2,
            p_img_3,
            p_img_4,
            p_img_5,
            pn_1,
            pn_2,
            pn_3,
            pn_4,
            pn_5,
            pp_1,
            pp_2,
            pp_3,
            pp_4,
            pp_5,
            pcp_1,
            pcp_2,
            pcp_3,
            pcp_4,
            pcp_5,
            ar,
            cr,
            pr,
          } = d;
          const p_1_d = p_1 ? "" : "d-none";
          const p_2_d = p_2 ? "" : "d-none";
          const p_3_d = p_3 ? "" : "d-none";
          const p_4_d = p_4 ? "" : "d-none";
          const p_5_d = p_5 ? "" : "d-none";

          const pp_d_1 =
            Number(pcp_1.replace(/[^0-9]/g, "")) <
              Number(pp_1.replace(/[^0-9]/g, "")) || pcp_1 === ""
              ? "d-none"
              : "";
          const pp_d_2 =
            Number(pcp_2.replace(/[^0-9]/g, "")) <
              Number(pp_2.replace(/[^0-9]/g, "")) || pcp_2 === ""
              ? "d-none"
              : "";
          const pp_d_3 =
            Number(pcp_3.replace(/[^0-9]/g, "")) <
              Number(pp_3.replace(/[^0-9]/g, "")) || pcp_3 === ""
              ? "d-none"
              : "";
          const pp_d_4 =
            Number(pcp_4.replace(/[^0-9]/g, "")) <
              Number(pp_4.replace(/[^0-9]/g, "")) || pcp_4 === ""
              ? "d-none"
              : "";
          const pp_d_5 =
            Number(pcp_5.replace(/[^0-9]/g, "")) <
              Number(pp_5.replace(/[^0-9]/g, "")) || pcp_5 === ""
              ? "d-none"
              : "";
          const container = document.createElement("div");
          const aspect_ratio = ar === "custom" ? cr.replace(":", "/") : ar;
          container.innerHTML = `
            <div class="tps__instagram-shop">
              <div class="tps__lookbook-items">
                <div class="tps__lookbook-image">
                  <div
                    class="tps__responsive-image tps-image-js"
                    style="--aspect-ratio: ${aspect_ratio};"
                  >
                    <img
                      srcset="${img}"
                    >
                  </div>
                </div>
                <div
                  class="tps__product-item absolute ${p_1_d}"
                  style="top: ${ot_1}%; left: ${ol_1}%; transform: translate(-${ot_1}%,-${ol_1}%)"
                >
                  <a href="${p_1}" target="_blank">
                    <span class="icon-dot icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" cslip-rule="evenodd" d="M5 0C4.44772 0 4 0.447715 4 1V4L1 4C0.447715 4 0 4.44771 0 5C0 5.55228 0.447715 6 1 6H4V9C4 9.55229 4.44772 10 5 10C5.55228 10 6 9.55228 6 9V6H9C9.55228 6 10 5.55229 10 5C10 4.44772 9.55228 4 9 4L6 4V1C6 0.447715 5.55228 0 5 0Z" fill=""></path>
                      </svg>
                    </span>
                  </a>
                </div>
                <div
                  class="tps__product-item absolute ${p_2_d}"
                  style="top: ${ot_2}%; left: ${ol_2}%; transform: translate(-${ot_2}%,-${ol_2}%)"
                >
                  <a href="${p_2}" target="_blank">
                    <span class="icon-dot icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" cslip-rule="evenodd" d="M5 0C4.44772 0 4 0.447715 4 1V4L1 4C0.447715 4 0 4.44771 0 5C0 5.55228 0.447715 6 1 6H4V9C4 9.55229 4.44772 10 5 10C5.55228 10 6 9.55228 6 9V6H9C9.55228 6 10 5.55229 10 5C10 4.44772 9.55228 4 9 4L6 4V1C6 0.447715 5.55228 0 5 0Z" fill=""></path>
                      </svg>
                    </span>
                  </a>
                </div>
                <div
                  class="tps__product-item absolute ${p_3_d}"
                  style="top: ${ot_3}%; left: ${ol_3}%; transform: translate(-${ot_3}%,-${ol_3}%)"
                >
                  <a href="${p_3}" target="_blank">
                    <span class="icon-dot icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" cslip-rule="evenodd" d="M5 0C4.44772 0 4 0.447715 4 1V4L1 4C0.447715 4 0 4.44771 0 5C0 5.55228 0.447715 6 1 6H4V9C4 9.55229 4.44772 10 5 10C5.55228 10 6 9.55228 6 9V6H9C9.55228 6 10 5.55229 10 5C10 4.44772 9.55228 4 9 4L6 4V1C6 0.447715 5.55228 0 5 0Z" fill=""></path>
                      </svg>
                    </span>
                  </a>
                </div>
                <div
                  class="tps__product-item absolute ${p_4_d}"
                  style="top: ${ot_4}%; left: ${ol_4}%; transform: translate(-${ot_4}%,-${ol_4}%)"
                >
                  <a href="${p_4}" target="_blank">
                    <span class="icon-dot icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" cslip-rule="evenodd" d="M5 0C4.44772 0 4 0.447715 4 1V4L1 4C0.447715 4 0 4.44771 0 5C0 5.55228 0.447715 6 1 6H4V9C4 9.55229 4.44772 10 5 10C5.55228 10 6 9.55228 6 9V6H9C9.55228 6 10 5.55229 10 5C10 4.44772 9.55228 4 9 4L6 4V1C6 0.447715 5.55228 0 5 0Z" fill=""></path>
                      </svg>
                    </span>
                  </a>
                </div>
                <div
                  class="tps__product-item absolute ${p_5_d}"
                  style="top: ${ot_5}%; left: ${ol_5}%; transform: translate(-${ot_5}%,-${ol_5}%)"
                >
                  <a href="${p_5}" target="_blank">
                    <span class="icon-dot icon">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" cslip-rule="evenodd" d="M5 0C4.44772 0 4 0.447715 4 1V4L1 4C0.447715 4 0 4.44771 0 5C0 5.55228 0.447715 6 1 6H4V9C4 9.55229 4.44772 10 5 10C5.55228 10 6 9.55228 6 9V6H9C9.55228 6 10 5.55229 10 5C10 4.44772 9.55228 4 9 4L6 4V1C6 0.447715 5.55228 0 5 0Z" fill=""></path>
                      </svg>
                    </span>
                  </a>
                </div>
              </div>
              <div class="tps__lookbook-content">
                <div class="tps__lookbook-info custom-scrollbar">
                  <div class="tps__lookbook-product">
                    <div class="tps__lookbook-product-items ${p_1_d}">
                      <a href="${p_1}" target="_blank">
                        <div
                          class="tps__responsive-image tps-image-js"
                          style="--aspect-ratio: ${pr};"
                        >
                          <img
                            srcset="${p_img_1}"
                          >
                        </div>
                        <div
                        class="tps__product-details pt-10"
                        >
                          <div class="tps__product-name regular mb-0">${pn_1}</div>
                          <p class="tps__product-price mb-4" ><span>${pp_1}</span><s class="px-5 ${pp_d_1}">${pcp_1}</s></p>
                        </div>
                      </a>
                    </div>
                    <div class="tps__lookbook-product-items ${p_2_d}">
                      <a href="${p_2}" target="_blank">
                        <div
                          class="tps__responsive-image tps-image-js"
                          style="--aspect-ratio: ${pr};"
                        >
                          <img
                            srcset="${p_img_2}"
                          >
                        </div>
                        <div
                        class="tps__product-details pt-10"
                        >
                        <div class="tps__product-name regular mb-0">${pn_2}</div>
                        <p class="tps__product-price mb-4" ><span>${pp_2}</span><s class="px-5 ${pp_d_2}">${pcp_2}</s></p>
                        </div>
                      </a>
                    </div>
                    <div class="tps__lookbook-product-items ${p_3_d}">
                      <a href="${p_3}" target="_blank">
                        <div
                          class="tps__responsive-image tps-image-js"
                          style="--aspect-ratio: ${pr};"
                        >
                          <img
                            srcset="${p_img_3}"
                          >
                        </div>
                        <div
                        class="tps__product-details pt-10"
                        >
                        <div class="tps__product-name regular mb-0">${pn_3}</div>
                        <p class="tps__product-price mb-4" ><span>${pp_3}</span><s class="px-5 ${pp_d_3}">${pcp_3}</s></p>
                        </div>
                      </a>
                    </div>
                    <div class="tps__lookbook-product-items ${p_4_d}">
                      <a href="${p_4}" target="_blank">
                        <div
                          class="tps__responsive-image tps-image-js"
                          style="--aspect-ratio: ${pr};"
                        >
                          <img
                            srcset="${p_img_4}"
                          >
                        </div>
                        <div
                        class="tps__product-details pt-10"
                        >
                        <div class="tps__product-name regular mb-0">${pn_4}</div>
                        <p class="tps__product-price mb-4" ><span>${pp_4}</span><s class="px-5 ${pp_d_4}">${pcp_4}</s></p>
                        </div>
                      </a>
                    </div>
                    <div class="tps__lookbook-product-items ${p_5_d}">
                      <a href="${p_5}" target="_blank">
                        <div
                          class="tps__responsive-image tps-image-js"
                          style="--aspect-ratio: ${pr};"
                        >
                          <img
                            srcset="${p_img_5}"
                          >
                        </div>
                        <div
                        class="tps__product-details pt-10"
                        >
                        <div class="tps__product-name regular mb-0">${pn_5}</div>
                        <p class="tps__product-price mb-4" ><span>${pp_5}</span><s class="px-5 ${pp_d_5}">${pcp_5}</s></p>
                        </div>
                      </a>
                    </div>
                  </div>
                
                <div class="tps__lookbook-caption">
                  <p>
                  ${cap_1.replaceAll(/\n/g, "<br>")}
                  </p>
                  <p>
                    ${cap_2}
                  </p>
                </div>
                <a href="${cap_4}" target="_blank">
                  ${cap_3}
                </a>
                </div>
              </div>
            </div>
          `;
          return container;
        }
      }
    }
  }
}
customElements.define("instagram-shop", InstagramShop);

class FeatureButton extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll("a.demo").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const is_shown = document.querySelector("#dlg-demo-feature_0");
    if (event.currentTarget && is_shown === null) {
      var fbtn = EasyDialogBox.create(
        "dlg-demo-feature",
        "dlg dlg-disable-heading dlg-disable-footer dlg-disable-drag",
        "",
        this.htmlRender().outerHTML
      );
      fbtn.onClose = fbtn.destroy;
      fbtn.show();
    }
  }
  htmlRender() {
    const container = document.createElement("div");
    const parent = document.createElement("div");
    const listHome =
      '{"home1":["main-demo.jpg","146577129769", "Main Demo", "Popular", "Clothing & Fashion Demo"], "home2":["skin-care.jpg","146577522985", "Skincare", "Popular", "Health & Beauty Demo"], "home3":["simple-morden.jpg","146577359145", "Simple Modern", "Popular", "Clothing & Fashion Demo"], "home4":["simple-fashion.jpg","146577326377", "Simple Fashion", "New", "Clothing & Fashion Demo"], "home5":["trendy-style.jpg","146577490217", "Trendy Style", "Popular", "Clothing & Fashion Demo"], "home6":["minimal-colthing.jpg","146577391913", "Minimal Clothings", "New", "Clothing & Fashion Demo"], "home7":["men-luxury.jpg","146577260841", "Men\'s Luxury", "Popular", "Clothing & Fashion Demo"], "home8":["colthing-store.jpg","146577228073", "Clothing Store", "New", "Clothing & Fashion Demo"], "home9":["categories-men.jpg","146577195305", "Categories Men\'s", "Popular", "Clothing & Fashion Demo"], "home10":["watches.jpg","146577457449", "Unique Watches", "New", "Modern Watches Demo"], "home11":["underwear.jpg","146577424681", "Underwear", "New", "Clothing & Fashion Demo"], "home12":["rtl.jpg","146577293609", "RTL Demo", "", "Clothing & Fashion Demo"]}';
    const myObjHomeDemo = JSON.parse(listHome);

    container.setAttribute("class", "preview-demo-home-page");
    parent.setAttribute("class", "uminio-grid row");
    for (let itemH in myObjHomeDemo) {
      const themeImage = document.createElement("div");
      themeImage.setAttribute("class", "theme-img");
      const aDemoLinkImg = document.createElement("a");
      aDemoLinkImg.setAttribute("target", "_blank");
      aDemoLinkImg.setAttribute(
        "href",
        "https://umino-demo.myshopify.com/?preview_theme_id=" +
          myObjHomeDemo[itemH][1]
      );
      aDemoLinkImg.setAttribute("title", myObjHomeDemo[itemH][2]);
      const aDemoImg = document.createElement("img");
      aDemoImg.setAttribute("width", "350");
      aDemoImg.setAttribute("height", "256");
      aDemoImg.setAttribute("loading", "lazy");
      aDemoImg.setAttribute(
        "src",
        "https://blueskytechmage.com/shopify/umino-preview-home/" +
          myObjHomeDemo[itemH][0]
      );
      aDemoImg.setAttribute("alt", myObjHomeDemo[itemH][2]);
      aDemoLinkImg.appendChild(aDemoImg);
      if (myObjHomeDemo[itemH][3] != "") {
        const themeLabel = document.createElement("label");
        themeLabel.setAttribute(
          "class",
          "label-demo-home-postion " + myObjHomeDemo[itemH][3].toLowerCase()
        );
        themeLabel.appendChild(
          document.createTextNode(myObjHomeDemo[itemH][3])
        );
        themeImage.appendChild(themeLabel);
      }
      themeImage.appendChild(aDemoLinkImg);
      const themeInfo = document.createElement("div");
      themeInfo.setAttribute("class", "theme-info");
      const themeName = document.createElement("h3");
      const aDemoLink = document.createElement("a");
      aDemoLink.setAttribute("target", "_blank");
      aDemoLink.setAttribute(
        "href",
        "https://umino-demo.myshopify.com/?preview_theme_id=" +
          myObjHomeDemo[itemH][1]
      );
      aDemoLink.setAttribute("title", myObjHomeDemo[itemH][2]);
      aDemoLink.appendChild(document.createTextNode(myObjHomeDemo[itemH][2]));
      themeName.appendChild(aDemoLink);
      themeInfo.appendChild(themeName);
      const themeDes = document.createElement("p");
      themeDes.appendChild(document.createTextNode(myObjHomeDemo[itemH][4]));
      themeInfo.appendChild(themeDes);
      const itemHome = document.createElement("div");
      itemHome.setAttribute("class", "theme-item col-lg-3 col-sm-6");
      itemHome.appendChild(themeImage);
      itemHome.appendChild(themeInfo);
      parent.appendChild(itemHome);
    }
    container.appendChild(parent);
    return container;
  }
}

class SkeletonPage extends HTMLElement {
  constructor() {
    super();
    const url = "?section_id=skeleton-page";

    fetch(`${window.Shopify.routes.root}${url}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = newParser.parseFromString(responseText, "text/html");
        const p = html.querySelector("#tps__skeleton");
        if (p) {
          this.innerHTML = p.innerHTML;
        }
      })
      .catch((e) => {
        throw e;
      });
  }
}
customElements.define("skeleton-page", SkeletonPage);

class VideoYoutube extends HTMLElement {
  constructor() {
    super();
    const thumb = this.closest(".tps__video-thumb");
    if (thumb) {
      thumb.querySelector(".tps__thmbnail-video").classList.add("d-none");
    }
  }
}
customElements.define("video-youtube", VideoYoutube);

class HeaderTotalPrice extends HTMLElement {
  constructor() {
    super();
  }
  updateTotal(cart) {
    this.minicart_total = this.querySelector("[data-cart-subtotal-price]");
    if (!this.minicart_total) return;
    if (!cart.total_price) return;
    const price_format = Shopify.formatMoney(
      cart.total_price,
      cartStrings.money_format
    );
    this.minicart_total.innerHTML = price_format;
  }
}
customElements.define("header-total-price", HeaderTotalPrice);
