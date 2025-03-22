"use strict";

const parser = new DOMParser();

var TpsComparePageShopify = (function () {
    return {

        initCompareItems: function () {
            this.init();
        },

        init: function () {
            const compare_items = JSON.parse(localStorage.getItem('tps__compare-items'));
            const compareDiv = document.querySelector('.tps__compare-page-section');
            const productTable = document.querySelector('.tp-compare-area');
            const div_no_product = compareDiv.querySelector('.tps__compare-no-product-js');
            if (compare_items === null || compare_items.length === 0) {
                div_no_product.classList.remove('d-none');
                productTable.classList.add('d-none');
            }
            else {
                var query = '';
                compare_items.forEach((e, key, compare_items) => {

                    if (!Object.is(compare_items.length - 1, key)) {
                        query += e + '%20OR%20handle:';
                    }
                    else {
                        query += e;
                    }
                })

                var productAjaxURL = "?view=compare&type=product&options[unavailable_products]=last&q=handle:" + query;
                fetch(`${window.routes.search_url}${productAjaxURL}`)
                    .then(response => response.text())
                    .then((responseText) => {
                        const html = parser.parseFromString(responseText, 'text/html');
                        const table = compareDiv.querySelector('.table > tbody');
                        if (compare_items.length !== 0) {
                            const basic = document.querySelector('.tp__compare-row-basic');
                            const vendor = document.querySelector('.tp-compare-desc-1');
                            const availability = document.querySelector('.tp__compare-row-availability');
                            const price = document.querySelector('.tp__compare-row-price');
                            const cart = document.querySelector('.tp__compare-row-cart');
                            const deletecompare = document.querySelector('.tp__compare-row-delete');

                            const bpc2 = html.querySelectorAll('.all_product_hear .tp__product-compare');
                            if (bpc2.length > 0) {
                                if (table) {
                                    table.classList.remove('d-none');
                                    const exist_items = table.querySelectorAll('.tp__compare-value');
                                    if (exist_items.length !== 0) {
                                        exist_items.forEach(ei => {
                                            ei.remove();
                                        })
                                    }
                                }

                                bpc2.forEach(el => {
                                    basic.innerHTML += "<td>" + el.querySelector('.tp__compare-row-basic').innerHTML + "</td>";
                                    vendor.innerHTML += "<td>" + el.querySelector('.tp__compare-row-vendor').innerHTML + "</td>";
                                    availability.innerHTML += "<td>" + el.querySelector('.tp__compare-row-availability').innerHTML + "</td>";
                                    price.innerHTML += "<td>" + el.querySelector('.tp__compare-row-price').innerHTML + "</td>";
                                    cart.innerHTML += "<td>" + el.querySelector('.tp__compare-row-cart').innerHTML + "</td>";
                                    deletecompare.innerHTML += "<td>" + el.querySelector('.tp__compare-row-delete').innerHTML + "</td>";
                                })
                            } else {
                                div_no_product.classList.remove('d-none');
                            }
                        }
                    }).catch((e) => {
                        console.error(e);
                    });
            }
        },

        // removeCompareItem: function () {
        //     const removeButtons = document.querySelectorAll('.tp__compare-row-delete button');
        //     removeButtons.forEach(button => {
        //         button.addEventListener('click', function (event) {
        //             event.preventDefault();
        //             // Traverse DOM to find the product handle
        //             const handle = this.closest('.tp__compare-row-delete').dataset.productHandle;
        //             if (!handle) {
        //                 console.error('Product handle not found.');
        //                 return;
        //             }
        //             let compareItems = JSON.parse(localStorage.getItem('tps__compare-items'));
        //             compareItems = compareItems.filter(item => item !== handle);
        //             localStorage.setItem('tps__compare-items', JSON.stringify(compareItems));
        //             window.location.reload();
        //         });
        //     });
        // }


    }
})();
TpsComparePageShopify.initCompareItems();