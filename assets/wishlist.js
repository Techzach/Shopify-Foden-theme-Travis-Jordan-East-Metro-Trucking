"use strict";
var wishlist_items = JSON.parse(localStorage.getItem('tps__wishlist-items'));
var wishlistDiv = document.querySelector('.tps__wishlist-page-main');

var TpsWishlistPageShopify = (function() {
    return {
        initWishlistItems: function() {
            if (window.location.search.indexOf("page=") == -1) {
                this.init();
            }
        },

        justDemo: function () {
            const _this = this;
            if (wishlistDiv) {
                const div_no_product = wishlistDiv.querySelector('.tps__wishlist-no-product-js');
                if (wishlist_items === null || wishlist_items.length === 0) {
                    div_no_product.classList.remove('d-none');
                }else{
                    var query = '';
                    wishlist_items.forEach((e, key, wishlist_items) => {
                            if (!Object.is(wishlist_items.length - 1, key)) {
                            query += e+'%20OR%20handle:';
                            }
                            else{
                            query += e;
                            }
                        }
                    )
                }
            }
        },
        
        init: function () {
            const _this = this;
            if (wishlistDiv) {
                const div_no_product = wishlistDiv.querySelector('.tps__wishlist-no-product-js');
                if (wishlist_items === null || wishlist_items.length === 0) {
                    div_no_product.classList.remove('d-none');
                }else{
                    var query = '';
                    wishlist_items.forEach((e, key, wishlist_items) => {
                        
                        if (!Object.is(wishlist_items.length - 1, key)) {
                            query += e+'%20OR%20handle:';
                        }
                        else{
                            query += e;
                        }
                    })
                    var productAjaxURL = "?view=wishlist&type=product&options[unavailable_products]=last&q=handle:"+query;
                    fetch(`${window.routes.search_url}${productAjaxURL}`)
                    .then(response => response.text())
                    .then((responseText) => {
                        const html = parser.parseFromString(responseText, 'text/html');
                        const row = document.createElement('div');
                        row.classList.add('row');
                        const exist_row = wishlistDiv.querySelector('.tps__wishlist-page-main > table > tbody');
                        if (exist_row) {
                            exist_row.remove();
                        }
                        const er = html.querySelector(".tps__wishlist-page-main > table")
                        if(wishlist_items.length !== 0 && er){
                            const wishlistMain = html.querySelector('.tps__wishlist-page-main').innerHTML;
                            wishlistDiv.innerHTML = html.querySelector(".tps__wishlist-page-main").innerHTML;
                        }else{
                            div_no_product.classList.remove('d-none');
                        }
                    }).catch((e) => {
                        console.error(e);
                    }).finally(e => {
                        TpsSubActionProduct.handleInitQuickviewAction();
                        TpsSubActionProduct.init();
                    })
                }
            }
        },
        mergeItems: function () {
            const arr = [];
            if (wishlistDiv) {
                wishlistDiv.querySelectorAll(".tps__product-item").forEach(e => {
                    arr.push(e?.dataset.productHandle);
                })
            }
            localStorage.setItem('tps__wishlist-items',JSON.stringify(arr));
        }
      }
  })();

  TpsWishlistPageShopify.initWishlistItems();



