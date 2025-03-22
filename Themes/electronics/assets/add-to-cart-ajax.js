(function ($) {
  "use strict";
  $(document).ready(function () {
    $(document).on("submit", ".add-to-cart-rendom", function (e) {
      e.preventDefault();
      var $this = $(this);
      var variation_id = $this.find(".variation_id").val();
      var data = {
        variation_id: variation_id,
      };
      let add_product_cart_btn = $this.find(".add-product-cart-btn");
      const header_cart = $(".tp-header-action-main .tp-header-action-cart");
      $.ajax({
        type: "post",
        url: "/cart/add",
        data: $(this).serialize(),
        beforeSend: function (response) {
          add_product_cart_btn.find(".tp-product-tooltip").text("Adding...");
          add_product_cart_btn.find(".cart_btn_svg").hide();
          add_product_cart_btn.find(".loading-icon").show();
        },
        success: function (response) {
          add_product_cart_btn.find(".tp-product-tooltip").text("add to cart");
          add_product_cart_btn.find(".cart_btn_svg").show();
          add_product_cart_btn.find(".loading-icon").hide();
          add_product_cart_btn.find(".tp-product-tooltip").text("Added to cart");
          $.get("/cart", function (data) {
            $(".cartmini__widget").html($(data).find(".cartmini__widget").html());
            $(".cartmini__checkout-price").html($(data).find(".cartmini__checkout-price").html());
          });
          header_cart.find(".cart-count").text(response.item_count);
          update_header_cart();
        },
      });
    });

    function update_header_cart() {
      const cart = $("cart-notification") || $("cart-drawer");
      const header_cart = $(".tp-header-action-main .tp-header-action-cart");
      $.ajax({
        type: "get",
        url: "/cart.json",
        success: function (response) {
          header_cart.find(".cart-count").text(response.item_count);
        },
      });
    }

    $(document).on("click", "mini-cart-remove-button", function (e) {
      e.preventDefault();
      var $this = $(this);
      var index = $this.data("index");
      var id = $this.data("varient-id");
      var quantity = $this.data("quantity");
      var data = {
        index: index,
        id: id,
        quantity: 0,
      };
      $.ajax({
        type: "post",
        url: "/cart/change",
        data: data,
        success: function (response) {
          $.get("/cart", function (data) {
            $(".cartmini__widget").html($(data).find(".cartmini__widget").html());
            $(".cartmini__checkout-price").html($(data).find(".cartmini__checkout-price").html());
          });
          update_header_cart();
        },
      });
    });

    $(document).on("click", ".tps__compare-remove-js", function (e) {
      e.preventDefault();
      var id = $(this).data("product-handle");      var compare_products = JSON.parse(localStorage.getItem("tps__compare-items"));
      compare_products = compare_products.filter((item) => item !== id);
      localStorage.setItem("tps__compare-items", JSON.stringify(compare_products));
      window.location.reload();
    });

    $(document).on("click", ".remove_item_wishlist", function (e) {
      e.preventDefault();
      var id = $(this).data("product-handle");
      var wishlist_products = JSON.parse(localStorage.getItem("tps__wishlist-items"));
      $(this).closest("tr").remove();
      wishlist_products = wishlist_products.filter((item) => item !== id);
      localStorage.setItem("tps__wishlist-items", JSON.stringify(wishlist_products));
    });
  });
})(jQuery);
