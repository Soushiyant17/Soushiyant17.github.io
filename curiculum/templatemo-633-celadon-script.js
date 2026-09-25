/*
  Celadon Template
  https://templatemo.com/tm-633-celadon
*/

(function() {
    "use strict";
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- header shadow ---------- */
    var top = document.getElementById("top");
    var onScroll = function() {
        top.classList.toggle("stuck", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, {
        passive: true
    });
    onScroll();

    /* ---------- drawer ---------- */
    var burger = document.getElementById("burger");
    var drawer = document.getElementById("drawer");
    var scrim = document.getElementById("scrim");

    function setDrawer(open) {
        drawer.classList.toggle("on", open);
        scrim.classList.toggle("on", open);
        document.body.classList.toggle("lock", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    burger.addEventListener("click", function() {
        setDrawer(!drawer.classList.contains("on"));
    });
    scrim.addEventListener("click", function() {
        setDrawer(false);
    });
    drawer.addEventListener("click", function(e) {
        if (e.target.closest("a")) setDrawer(false);
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") setDrawer(false);
    });

    /* ---------- reveal with mandatory fallback ---------- */
    var items = document.querySelectorAll(".rv");

    function showAll() {
        for (var i = 0; i < items.length; i++) items[i].classList.add("in");
    }
    if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(en) {
                if (en.isIntersecting) {
                    en.target.classList.add("in");
                    io.unobserve(en.target);
                }
            });
        }, {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px"
        });
        for (var i = 0; i < items.length; i++) io.observe(items[i]);
        setTimeout(showAll, 3000);
    } else {
        showAll();
    }

    /* ---------- back to top, retreats with the hero ---------- */
    var hero = document.querySelector(".hero");
    if ("IntersectionObserver" in window && hero) {
        var ho = new IntersectionObserver(function(en) {
            document.body.classList.toggle("away", en[0].intersectionRatio < 0.5);
        }, {
            threshold: [0, .25, .5, .75, 1]
        });
        ho.observe(hero);
    }
    document.getElementById("up").addEventListener("click", function() {
        window.scrollTo({
            top: 0,
            behavior: reduce ? "auto" : "smooth"
        });
    });

    /* ---------- hero parallax, decorative layers only ---------- */
    var stage = document.querySelector(".stage");
    if (stage && !reduce && window.matchMedia("(min-width:721px)").matches) {
        var layers = stage.querySelectorAll("[data-depth]");
        var tx = 0,
            ty = 0,
            cx = 0,
            cy = 0,
            hRaf = null;
        var pump = function() {
            cx += (tx - cx) * 0.07;
            cy += (ty - cy) * 0.07;
            for (var i = 0; i < layers.length; i++) {
                var d = parseFloat(layers[i].getAttribute("data-depth"));
                if (isNaN(d)) d = 0;
                var base = layers[i].classList.contains("core") ? "translate(-50%,-50%) " : "";
                layers[i].style.transform = base + "translate3d(" + (cx * d).toFixed(2) + "px," + (cy * d).toFixed(2) + "px,0)";
            }
            if (Math.abs(tx - cx) > 0.02 || Math.abs(ty - cy) > 0.02) {
                hRaf = requestAnimationFrame(pump);
            } else {
                hRaf = null;
            }
        };
        window.addEventListener("pointermove", function(e) {
            var r = stage.getBoundingClientRect();
            tx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 2;
            ty = ((e.clientY - (r.top + r.height / 2)) / r.height) * 2;
            if (hRaf === null) hRaf = requestAnimationFrame(pump);
        }, {
            passive: true
        });
    }

    /* ---------- stat counters ---------- */
    var nums = document.querySelectorAll(".stat b");

    function runNum(el) {
        var to = parseFloat(el.getAttribute("data-to"));
        var sfx = el.getAttribute("data-suffix") || "";
        if (isNaN(to)) return;
        if (reduce) {
            el.textContent = to.toLocaleString() + sfx;
            return;
        }
        var t0 = performance.now(),
            dur = 1200;
        var tick = function(now) {
            var p = Math.min(1, (now - t0) / dur);
            var e = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(to * e).toLocaleString() + sfx;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    if ("IntersectionObserver" in window) {
        var no = new IntersectionObserver(function(en) {
            en.forEach(function(x) {
                if (x.isIntersecting) {
                    runNum(x.target);
                    no.unobserve(x.target);
                }
            });
        }, {
            threshold: 0.5
        });
        for (var n = 0; n < nums.length; n++) no.observe(nums[n]);
        setTimeout(function() {
            for (var n = 0; n < nums.length; n++) runNum(nums[n]);
        }, 3000);
    } else {
        for (var n2 = 0; n2 < nums.length; n2++) runNum(nums[n2]);
    }

    /* ---------- testimonial rail ---------- */
    var view = document.getElementById("viewport");
    var lane = document.getElementById("lane");
    if (view && lane) {
        var cards = lane.children;
        var x = 0,
            minX = 0,
            vel = 0,
            snap = null,
            raf = null;
        var down = false,
            promoted = false,
            startX = 0,
            startPointer = 0,
            lastP = 0,
            lastT = 0,
            padL = 0;
        var idx = -1;
        var prevB = document.getElementById("prev");
        var nextB = document.getElementById("next");
        var count = document.getElementById("count");

        function pad2(n) {
            return (n < 10 ? "0" : "") + n;
        }

        var lag = [],
            tfCache = [];
        for (var c = 0; c < cards.length; c++) {
            lag.push(0);
            tfCache.push("");
        }

        function physics() {
            if (reduce) return false;
            var moving = false;
            for (var i = 0; i < cards.length; i++) {
                var k = 0.155 - (i % 3) * 0.032;
                lag[i] += (vel - lag[i]) * k;
                if (Math.abs(lag[i]) > 0.03) moving = true;
                else lag[i] = 0;
                var rot = (-lag[i] * 0.115).toFixed(2);
                var dy = (Math.abs(lag[i]) * 0.3).toFixed(2);
                var t = "rotate(" + rot + "deg) translateY(" + dy + "px)";
                if (tfCache[i] !== t) {
                    cards[i].style.transform = t;
                    tfCache[i] = t;
                }
            }
            return moving;
        }

        function measure() {
            padL = parseFloat(getComputedStyle(lane).paddingLeft) || 0;
            minX = Math.min(0, view.clientWidth - lane.scrollWidth);
            if (x < minX) x = minX;
            if (x > 0) x = 0;
            draw();
        }

        function nearest() {
            var best = 0,
                bestD = Infinity;
            for (var i = 0; i < cards.length; i++) {
                var d = Math.abs(cards[i].offsetLeft + x - padL);
                if (d < bestD) {
                    bestD = d;
                    best = i;
                }
            }
            return best;
        }

        function draw() {
            lane.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
            var i = nearest();
            if (i !== idx) {
                idx = i;
                count.textContent = pad2(i + 1) + " / " + pad2(cards.length);
            }
            prevB.disabled = x >= -1;
            nextB.disabled = x <= minX + 1;
        }

        function loop() {
            if (snap !== null) {
                x += (snap - x) * 0.16;
                if (Math.abs(snap - x) < 0.5) {
                    x = snap;
                    snap = null;
                }
            } else if (!down) {
                if (Math.abs(vel) > 0.1) {
                    x += vel;
                    vel *= 0.92;
                    if (x > 0) {
                        x = 0;
                        vel = 0;
                    }
                    if (x < minX) {
                        x = minX;
                        vel = 0;
                    }
                } else {
                    vel = 0;
                }
            }
            draw();
            var springing = physics();
            if (snap !== null || Math.abs(vel) > 0.1 || down || springing) {
                raf = requestAnimationFrame(loop);
            } else {
                raf = null;
            }
        }

        function kick() {
            if (raf === null) raf = requestAnimationFrame(loop);
        }

        function goTo(i) {
            i = Math.max(0, Math.min(cards.length - 1, i));
            snap = Math.max(minX, Math.min(0, -(cards[i].offsetLeft - padL)));
            kick();
        }
        prevB.addEventListener("click", function() {
            goTo(nearest() - 1);
        });
        nextB.addEventListener("click", function() {
            goTo(nearest() + 1);
        });

        view.addEventListener("pointerdown", function(e) {
            down = true;
            promoted = false;
            snap = null;
            vel = 0;
            startX = x;
            startPointer = e.clientX;
            lastP = e.clientX;
            lastT = performance.now();
        });
        view.addEventListener("pointermove", function(e) {
            if (!down) return;
            var travel = e.clientX - startPointer;
            if (!promoted) {
                if (Math.abs(travel) < 8) return;
                promoted = true;
                view.classList.add("dragging");
                try {
                    view.setPointerCapture(e.pointerId);
                } catch (err) {}
            }
            x = startX + travel;
            if (x > 0) x = x * 0.35;
            if (x < minX) x = minX + (x - minX) * 0.35;
            var now = performance.now(),
                dt = now - lastT;
            if (dt > 0) vel = (e.clientX - lastP) / dt * 15;
            lastP = e.clientX;
            lastT = now;
            kick();
        });

        function endDrag() {
            if (!down) return;
            down = false;
            promoted = false;
            view.classList.remove("dragging");
            if (x > 0 || x < minX) {
                snap = x > 0 ? 0 : minX;
                vel = 0;
            }
            if (!reduce) {
                for (var i = 0; i < lag.length; i++) {
                    lag[i] *= 1.35;
                }
            }
            kick();
        }
        view.addEventListener("pointerup", endDrag);
        view.addEventListener("pointercancel", endDrag);
        view.addEventListener("lostpointercapture", endDrag);
        window.addEventListener("pointerup", endDrag);
        window.addEventListener("blur", endDrag);
        view.addEventListener("dragstart", function(e) {
            e.preventDefault();
        });
        view.addEventListener("wheel", function() {
            snap = null;
        }, {
            passive: true
        });

        window.addEventListener("resize", measure);
        window.addEventListener("load", measure);
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(measure);
        }
        measure();
    }

    /* ---------- features slab, click only ---------- */
    var slabrow = document.getElementById("slabrow");
    if (slabrow) {
        var staves = slabrow.querySelectorAll(".stave");

        function openStave(el) {
            if (el.classList.contains("open")) return;
            for (var i = 0; i < staves.length; i++) {
                var on = staves[i] === el;
                staves[i].classList.toggle("open", on);
                staves[i].setAttribute("aria-expanded", on ? "true" : "false");
            }
        }
        for (var s = 0; s < staves.length; s++) {
            (function(el) {
                el.addEventListener("click", function() {
                    openStave(el);
                });
                el.addEventListener("keydown", function(e) {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openStave(el);
                        return;
                    }
                    var dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0);
                    if (dir) {
                        e.preventDefault();
                        var here = Array.prototype.indexOf.call(staves, el);
                        var to = staves[Math.max(0, Math.min(staves.length - 1, here + dir))];
                        openStave(to);
                        to.focus();
                    }
                });
            })(staves[s]);
        }
    }

    /* ---------- pricing toggle ---------- */
    var sw = document.getElementById("switch");
    if (sw) {
        var prices = document.querySelectorAll(".price");
        var pers = document.querySelectorAll(".per");
        var totals = document.querySelectorAll(".plan .total");
        var plansEl = document.querySelector(".plans");
        var lblM = document.getElementById("lblM"),
            lblY = document.getElementById("lblY");

        function money(n) {
            return "$" + Number(n).toLocaleString();
        }

        function setYear(yearly) {
            sw.setAttribute("aria-checked", yearly ? "true" : "false");
            sw.setAttribute("aria-label", yearly ? "Switch to monthly billing" : "Switch to yearly billing");
            lblM.classList.toggle("on", !yearly);
            lblY.classList.toggle("on", yearly);
            if (plansEl) plansEl.classList.toggle("yearly", yearly);
            for (var i = 0; i < prices.length; i++) {
                prices[i].textContent = money(prices[i].getAttribute(yearly ? "data-y" : "data-m"));
            }
            for (var j = 0; j < pers.length; j++) {
                pers[j].textContent = yearly ? "per month, billed yearly" : "per month";
            }
            for (var k = 0; k < totals.length; k++) {
                var t = totals[k];
                if (yearly) {
                    var full = parseFloat(t.getAttribute("data-m")) * 12;
                    t.innerHTML = "<b>" + money(t.getAttribute("data-y")) + "</b> a year <span class=\"was\">" + money(full) + "</span>";
                } else {
                    t.textContent = "Billed monthly";
                }
            }
        }
        sw.addEventListener("click", function() {
            setYear(sw.getAttribute("aria-checked") !== "true");
        });
        sw.addEventListener("keydown", function(e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setYear(sw.getAttribute("aria-checked") !== "true");
            }
        });
    }

    /* ---------- faq, click only ---------- */
    var qs = document.querySelectorAll(".q");

    function toggleQ(q) {
        var open = q.classList.toggle("open");
        q.setAttribute("aria-expanded", open ? "true" : "false");
    }
    for (var q = 0; q < qs.length; q++) {
        (function(el) {
            el.addEventListener("click", function() {
                toggleQ(el);
            });
            el.addEventListener("keydown", function(e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleQ(el);
                }
            });
        })(qs[q]);
    }
})();