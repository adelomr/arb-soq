(self.webpackChunk_N_E = self.webpackChunk_N_E || []).push([
  [479],
  {
    1813: (e, t, a) => {
      "use strict";
      a.d(t, { default: () => $ });
      var r = a(95155),
        s = a(88661),
        l = a.n(s),
        i = a(12115),
        n = a(39390),
        o = a(14585),
        c = a(2068),
        d = a(35130),
        u = a(85921),
        x = a(20508),
        m = a(46826),
        f = a(83457),
        b = a(5937),
        h = a(17181),
        p = a(85449),
        g = a(21873),
        v = a(85897),
        j = a(11647),
        w = a(15894),
        y = a(52619),
        N = a.n(y);
      function k(e) {
        var t, a, s, n, o, y;
        let { ad: k, isActive: A, isMuted: T, onToggleMute: S } = e,
          [E, _] = (0, i.useState)(!1),
          [I, z] = (0, i.useState)(0),
          U = (0, i.useRef)(null),
          O = (0, i.useRef)(null),
          D =
            (null == (t = k.videoUrl) ? void 0 : t.includes("youtube.com")) ||
            (null == (a = k.videoUrl) ? void 0 : a.includes("youtu.be")),
          C = "image" === k.adType || "صوري" === k.adType,
          R = k.videoUrl
            ? ((e) => {
                if (!e) return null;
                let t = e.match(
                  /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/,
                );
                return t && 11 === t[2].length ? t[2] : null;
              })(k.videoUrl)
            : null;
        return (
          (0, i.useEffect)(() => {
            if (A) {
              if (
                (U.current &&
                  (U.current.play().catch(() => {}), (U.current.muted = T)),
                _(!0),
                C)
              ) {
                z(0);
                let e = setInterval(() => {
                  z((e) => (e < 100 ? e + 0.5 : 0));
                }, 50);
                return () => clearInterval(e);
              }
            } else (U.current && U.current.pause(), _(!1));
          }, [A, C]),
          (0, i.useEffect)(() => {
            U.current && (U.current.muted = T);
          }, [T]),
          (0, r.jsxs)("div", {
            className:
              "jsx-a722aef651c376d2 relative w-full h-full bg-black snap-start overflow-hidden group",
            children: [
              (0, r.jsx)("div", {
                className: "jsx-a722aef651c376d2 absolute inset-0 bg-black z-0",
              }),
              (0, r.jsxs)("div", {
                onClick: () => {
                  !C &&
                    (_(!E),
                    U.current &&
                      (E
                        ? U.current.pause()
                        : U.current.play().catch(() => {})));
                },
                className:
                  "jsx-a722aef651c376d2 absolute inset-0 flex items-center justify-center z-10",
                children: [
                  C
                    ? (0, r.jsxs)("div", {
                        className:
                          "jsx-a722aef651c376d2 relative w-full h-full overflow-hidden",
                        children: [
                          (0, r.jsx)("img", {
                            src:
                              (null == (s = k.imageUrls) ? void 0 : s[0]) ||
                              k.imageUrl ||
                              "/pattern-placeholder.jpg",
                            alt: k.title,
                            className:
                              "jsx-a722aef651c376d2 w-full h-full object-cover animate-ken-burns",
                          }),
                          (0, r.jsx)("div", {
                            className:
                              "jsx-a722aef651c376d2 absolute inset-0 bg-black/10 backdrop-blur-[2px] pointer-events-none",
                          }),
                        ],
                      })
                    : D && R
                      ? (0, r.jsx)("iframe", {
                          ref: O,
                          src: "https://www.youtube.com/embed/"
                            .concat(R, "?autoplay=")
                            .concat(+!!A, "&mute=")
                            .concat(
                              +!!T,
                              "&controls=0&modestbranding=1&rel=0&loop=1&playlist=",
                            )
                            .concat(R),
                          allow: "autoplay; encrypted-media",
                          className:
                            "jsx-a722aef651c376d2 w-full h-full pointer-events-none",
                        })
                      : (0, r.jsx)("video", {
                          ref: U,
                          src: k.videoUrl,
                          loop: !0,
                          playsInline: !0,
                          muted: T,
                          onTimeUpdate: () => {
                            U.current &&
                              z(
                                (U.current.currentTime / U.current.duration) *
                                  100,
                              );
                          },
                          className:
                            "jsx-a722aef651c376d2 w-full h-full object-contain",
                        }),
                  !C &&
                    (0, r.jsx)("button", {
                      onClick: (e) => {
                        (e.stopPropagation(), S());
                      },
                      className:
                        "jsx-a722aef651c376d2 absolute top-20 right-4 p-2 rounded-full bg-black/20 backdrop-blur-md z-30 transition-transform active:scale-90",
                      children: T
                        ? (0, r.jsx)(c.A, { className: "w-5 h-5 text-white" })
                        : (0, r.jsx)(d.A, { className: "w-5 h-5 text-white" }),
                    }),
                  !C &&
                    !E &&
                    (0, r.jsx)("div", {
                      className:
                        "jsx-a722aef651c376d2 absolute inset-0 flex items-center justify-center bg-black/20 z-20 transition-opacity duration-300",
                      children: (0, r.jsx)("div", {
                        className:
                          "jsx-a722aef651c376d2 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center",
                        children: (0, r.jsx)(u.A, {
                          className: "w-8 h-8 text-white fill-white ml-1",
                        }),
                      }),
                    }),
                ],
              }),
              (0, r.jsxs)("div", {
                className:
                  "jsx-a722aef651c376d2 absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30",
                children: [
                  (0, r.jsxs)("div", {
                    className:
                      "jsx-a722aef651c376d2 flex flex-col items-center gap-1 group/action",
                    children: [
                      (0, r.jsx)(N(), {
                        href: "/profile/".concat(k.userId),
                        className:
                          "w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-xl transition-transform hover:scale-105 active:scale-95",
                        children: (0, r.jsxs)(v.eu, {
                          className: "w-full h-full",
                          children: [
                            (0, r.jsx)(v.BK, {
                              src: null == (n = k.user) ? void 0 : n.avatarUrl,
                            }),
                            (0, r.jsx)(v.q5, {
                              className: "bg-primary text-primary-foreground",
                              children: (0, r.jsx)(x.A, {}),
                            }),
                          ],
                        }),
                      }),
                      (0, r.jsx)("button", {
                        className:
                          "jsx-a722aef651c376d2 bg-primary text-white rounded-full p-1 -mt-3 z-10 transition-transform hover:scale-110 active:scale-90",
                        children: (0, r.jsx)(m.A, { size: 12 }),
                      }),
                    ],
                  }),
                  (0, r.jsxs)("button", {
                    className:
                      "jsx-a722aef651c376d2 flex flex-col items-center group/btn",
                    children: [
                      (0, r.jsx)("div", {
                        className:
                          "jsx-a722aef651c376d2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center mb-1 group-active/btn:scale-95 transition-all outline-none",
                        children: (0, r.jsx)(f.A, {
                          className:
                            "w-6 h-6 text-white group-hover/btn:text-red-500 fill-transparent group-hover/btn:fill-red-500 transition-all duration-300 animate-heart-beat-hover",
                        }),
                      }),
                      (0, r.jsx)("span", {
                        className:
                          "jsx-a722aef651c376d2 text-white text-xs font-medium shadow-sm",
                        children: "1.2k",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("button", {
                    className:
                      "jsx-a722aef651c376d2 flex flex-col items-center group/btn",
                    children: [
                      (0, r.jsx)("div", {
                        className:
                          "jsx-a722aef651c376d2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center mb-1 group-active/btn:scale-90 transition-all",
                        children: (0, r.jsx)(b.A, {
                          className: "w-6 h-6 text-white",
                        }),
                      }),
                      (0, r.jsx)("span", {
                        className:
                          "jsx-a722aef651c376d2 text-white text-xs font-medium shadow-sm",
                        children: "230",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("button", {
                    onClick: (e) => {
                      (e.stopPropagation(),
                        navigator.share
                          ? navigator.share({
                              title: k.title,
                              text: k.description,
                              url: window.location.href + "?id=".concat(k.id),
                            })
                          : (navigator.clipboard.writeText(
                              window.location.href + "?id=".concat(k.id),
                            ),
                            (0, w.oR)({ title: "تم نسخ الرابط" })));
                    },
                    className:
                      "jsx-a722aef651c376d2 flex flex-col items-center group/btn",
                    children: [
                      (0, r.jsx)("div", {
                        className:
                          "jsx-a722aef651c376d2 w-12 h-12 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center mb-1 group-active/btn:scale-90 transition-all",
                        children: (0, r.jsx)(h.A, {
                          className: "w-6 h-6 text-white",
                        }),
                      }),
                      (0, r.jsx)("span", {
                        className:
                          "jsx-a722aef651c376d2 text-white text-xs font-medium shadow-sm",
                        children: "مشاركة",
                      }),
                    ],
                  }),
                  (0, r.jsx)("button", {
                    className:
                      "jsx-a722aef651c376d2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-lg flex items-center justify-center animate-spin-slow",
                    children: (0, r.jsx)(p.A, {
                      className: "w-5 h-5 text-white",
                    }),
                  }),
                ],
              }),
              (0, r.jsx)("div", {
                className:
                  "jsx-a722aef651c376d2 absolute bottom-0 left-0 right-0 p-4 pt-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 pointer-events-none",
                children: (0, r.jsxs)("div", {
                  className:
                    "jsx-a722aef651c376d2 flex flex-col gap-2 max-w-[85%]",
                  children: [
                    (0, r.jsxs)(N(), {
                      href: "/profile/".concat(k.userId),
                      className:
                        "flex items-center gap-2 group/user pointer-events-auto",
                      children: [
                        (0, r.jsxs)("h3", {
                          className:
                            "jsx-a722aef651c376d2 text-white font-bold text-lg drop-shadow-md group-hover/user:underline",
                          children: [
                            "@",
                            (null == (o = k.user) ? void 0 : o.name) ||
                              "مستخدم سوق العرب",
                          ],
                        }),
                        (null == (y = k.user) ? void 0 : y.store) &&
                          (0, r.jsx)(j.E, {
                            variant: "secondary",
                            className:
                              "bg-primary text-white text-[10px] py-0 px-1 h-4 border-none",
                            children: "متجر",
                          }),
                      ],
                    }),
                    (0, r.jsx)("p", {
                      className:
                        "jsx-a722aef651c376d2 text-white/90 text-sm line-clamp-2 leading-snug",
                      children: k.title,
                    }),
                    (0, r.jsx)("p", {
                      className:
                        "jsx-a722aef651c376d2 text-white/70 text-xs line-clamp-2 italic",
                      children: k.description,
                    }),
                    (0, r.jsxs)("div", {
                      className:
                        "jsx-a722aef651c376d2 flex items-center gap-3 mt-1 overflow-x-auto no-scrollbar",
                      children: [
                        (0, r.jsxs)(j.E, {
                          variant: "secondary",
                          className:
                            "bg-white/10 hover:bg-white/20 text-white border-none gap-1 py-1",
                          children: [
                            (0, r.jsx)(g.A, { className: "w-3 h-3" }),
                            k.governorate,
                            " ",
                            k.city ? "- ".concat(k.city) : "",
                          ],
                        }),
                        k.category &&
                          (0, r.jsxs)(j.E, {
                            variant: "secondary",
                            className:
                              "bg-primary/20 hover:bg-primary/30 text-primary-foreground border-none py-1",
                            children: ["#", k.category],
                          }),
                      ],
                    }),
                    (0, r.jsxs)("div", {
                      className:
                        "jsx-a722aef651c376d2 flex items-center gap-2 mt-2",
                      children: [
                        (0, r.jsx)(p.A, {
                          className: "w-3 h-3 text-white animate-pulse",
                        }),
                        (0, r.jsx)("span", {
                          className:
                            "jsx-a722aef651c376d2 text-white/80 text-xs overflow-hidden whitespace-nowrap marquee-text",
                          children:
                            "سوق بلدنا - أهلاً بك في عالم العروض المميزة",
                        }),
                      ],
                    }),
                  ],
                }),
              }),
              (0, r.jsx)("div", {
                className:
                  "jsx-a722aef651c376d2 absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-40",
                children: (0, r.jsx)("div", {
                  style: { width: "".concat(I, "%") },
                  className:
                    "jsx-a722aef651c376d2 h-full bg-primary transition-all duration-200",
                }),
              }),
              (0, r.jsx)(l(), {
                id: "a722aef651c376d2",
                children:
                  ".no-scrollbar.jsx-a722aef651c376d2::-webkit-scrollbar{display:none}.no-scrollbar.jsx-a722aef651c376d2{-ms-overflow-style:none;scrollbar-width:none}.marquee-text.jsx-a722aef651c376d2{animation:marquee 10s linear infinite;padding-left:100%}@keyframes marquee{0%{transform:translatex(0)}100%{transform:translatex(-100%)}}.animate-heart-beat-hover.jsx-a722aef651c376d2:hover{animation:heart-beat.8s ease-in-out infinite}@keyframes heart-beat{0%{transform:scale(1)}15%{transform:scale(1.15)}30%{transform:scale(1)}45%{transform:scale(1.15)}100%{transform:scale(1)}}.animate-spin-slow.jsx-a722aef651c376d2{animation:spin 3s linear infinite}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.animate-ken-burns.jsx-a722aef651c376d2{animation:ken-burns 15s ease-in-out infinite alternate}@keyframes ken-burns{0%{transform:scale(1)translate(0,0)}100%{transform:scale(1.3)translate(-2%,-2%)}}",
              }),
            ],
          })
        );
      }
      var A = a(27209),
        T = a(36168),
        S = a(16485),
        E = a(58148),
        _ = a(76422);
      function I(e) {
        let { ads: t, onVideoClick: a } = e;
        return (0, r.jsx)("div", {
          className:
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-y-10 gap-x-4 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
          children: t.map((e) => {
            var t;
            let s = ((e) => {
              if (e.imageUrls && e.imageUrls.length > 0 && e.imageUrls[0])
                return e.imageUrls[0];
              let t = e.videoUrl || "";
              if (t.includes("youtube.com") || t.includes("youtu.be")) {
                let e = t.match(
                    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/,
                  ),
                  a = e && 11 === e[2].length ? e[2] : null;
                if (a)
                  return "https://img.youtube.com/vi/".concat(
                    a,
                    "/maxresdefault.jpg",
                  );
              }
              return e.imageUrl ? e.imageUrl : null;
            })(e);
            return (0, r.jsxs)(
              "div",
              {
                onClick: () => a(e.id),
                className: "group cursor-pointer flex flex-col gap-3",
                children: [
                  (0, r.jsxs)("div", {
                    className:
                      "relative aspect-video rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 transition-all duration-300 group-hover:rounded-none group-hover:ring-primary/50 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]",
                    children: [
                      s
                        ? (0, r.jsx)("img", {
                            src: s,
                            className:
                              "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                            alt: e.title,
                          })
                        : (0, r.jsxs)("div", {
                            className:
                              "w-full h-full flex flex-col items-center justify-center gap-2 text-white/20",
                            children: [
                              (0, r.jsx)(A.A, { className: "w-12 h-12" }),
                              (0, r.jsx)("span", {
                                className: "text-xs",
                                children: "لا يوجد عرض مسبق",
                              }),
                            ],
                          }),
                      (0, r.jsx)("div", {
                        className:
                          "absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                        children: (0, r.jsx)("div", {
                          className:
                            "bg-primary/90 p-3 rounded-full blur-none scale-90 group-hover:scale-100 transition-transform",
                          children: (0, r.jsx)(T.A, {
                            className: "w-8 h-8 text-white fill-white",
                          }),
                        }),
                      }),
                      (0, r.jsx)("div", {
                        className: "absolute top-2 right-2",
                        children: (0, r.jsx)(j.E, {
                          variant: "secondary",
                          className:
                            "bg-black/60 backdrop-blur-md text-[10px] border-none text-white h-5",
                          children: "video" === e.adType ? "فيديو" : "صور",
                        }),
                      }),
                      (0, r.jsx)("div", {
                        className:
                          "absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-medium text-white",
                        children: e.category || "عام",
                      }),
                    ],
                  }),
                  (0, r.jsxs)("div", {
                    className: "flex gap-3 px-1",
                    children: [
                      (0, r.jsx)("div", {
                        className: "shrink-0 pt-0.5",
                        children: (0, r.jsx)("div", {
                          className:
                            "w-9 h-9 rounded-full bg-secondary/30 flex items-center justify-center border border-white/10 group-hover:border-primary/50 transition-colors",
                          children: (0, r.jsx)(x.A, {
                            className:
                              "w-5 h-5 text-white/40 group-hover:text-primary transition-colors",
                          }),
                        }),
                      }),
                      (0, r.jsxs)("div", {
                        className: "flex flex-col gap-1 overflow-hidden",
                        children: [
                          (0, r.jsx)("h3", {
                            className:
                              "text-white font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors text-sm lg:text-base",
                            children: e.title,
                          }),
                          (0, r.jsxs)("div", {
                            className:
                              "flex flex-col text-[13px] text-white/60",
                            children: [
                              (0, r.jsx)("span", {
                                className: "hover:text-white transition-colors",
                                children:
                                  (null == (t = e.user) ? void 0 : t.name) ||
                                  "سوق العرب",
                              }),
                              (0, r.jsxs)("div", {
                                className: "flex items-center gap-1.5 mt-0.5",
                                children: [
                                  (0, r.jsxs)("span", {
                                    className: "flex items-center gap-0.5",
                                    children: [
                                      (0, r.jsx)(g.A, {
                                        className: "w-3 h-3 text-primary",
                                      }),
                                      e.city || e.governorate,
                                    ],
                                  }),
                                  (0, r.jsx)("span", {
                                    className:
                                      "w-1 h-1 rounded-full bg-white/20",
                                  }),
                                  (0, r.jsxs)("span", {
                                    className: "flex items-center gap-0.5",
                                    children: [
                                      (0, r.jsx)(S.A, { className: "w-3 h-3" }),
                                      ((e) => {
                                        let t =
                                          e.timestamp ||
                                          (e.postedAt
                                            ? new Date(e.postedAt).getTime()
                                            : null);
                                        if (!t) return "";
                                        try {
                                          return (0, E.m)(new Date(t), {
                                            addSuffix: !0,
                                            locale: _.ar,
                                          });
                                        } catch (e) {
                                          return "";
                                        }
                                      })(e),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              },
              e.id,
            );
          }),
        });
      }
      var z = a(35299),
        U = a(39068),
        O = a(71871),
        D = a(65993),
        C = a(65229),
        R = a(54901),
        M = a(64269),
        V = a(17037),
        q = a(29829),
        F = a(57378);
      function P(e) {
        let { selectedCategory: t, onSelect: a } = e,
          { categories: s } = (0, R.A)();
        return (0, r.jsxs)("div", {
          className: "jsx-4a2575c74565639e w-full h-14 flex items-center mb-4",
          children: [
            (0, r.jsxs)(V.F, {
              className: "w-full whitespace-nowrap pb-2 no-scrollbar",
              dir: "rtl",
              children: [
                (0, r.jsxs)("div", {
                  className:
                    "jsx-4a2575c74565639e flex w-max space-x-3 space-x-reverse px-4",
                  children: [
                    (0, r.jsx)(j.E, {
                      variant: "all" === t ? "default" : "secondary",
                      className: (0, M.cn)(
                        "cursor-pointer py-2 px-5 text-sm transition-all rounded-full border-none",
                        "all" === t
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md",
                      ),
                      onClick: () => a("all"),
                      children: "الكل",
                    }),
                    s
                      .filter(
                        (e) => "stores" !== e.id && "store-product" !== e.id,
                      )
                      .map((e) => {
                        var s;
                        return (0, r.jsxs)(
                          j.E,
                          {
                            variant: t === e.id ? "default" : "secondary",
                            className: (0, M.cn)(
                              "cursor-pointer py-2 px-5 text-sm transition-all rounded-full border-none flex items-center gap-2",
                              t === e.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                : "bg-white/10 text-white hover:bg-white/20 backdrop-blur-md",
                            ),
                            onClick: () => a(e.id),
                            children: [
                              ((e) => {
                                let t = F[e] || q.A;
                                return (0, r.jsx)(t, { className: "w-4 h-4" });
                              })(e.icon),
                              (null == (s = e.name) ? void 0 : s.ar) || e.id,
                            ],
                          },
                          e.id,
                        );
                      }),
                  ],
                }),
                (0, r.jsx)(V.$, {
                  orientation: "horizontal",
                  className: "hidden",
                }),
              ],
            }),
            (0, r.jsx)(l(), {
              id: "4a2575c74565639e",
              children:
                ".no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}",
            }),
          ],
        });
      }
      var L = a(3998);
      function $() {
        let [e, t] = (0, i.useState)([]),
          [a, s] = (0, i.useState)(!0),
          [c, d] = (0, i.useState)(null),
          [u, x] = (0, i.useState)("all"),
          [m, f] = (0, i.useState)("all"),
          [b, h] = (0, i.useState)(!0),
          [p, v] = (0, i.useState)("grid"),
          j = (0, i.useRef)(null),
          { userProfile: w } = (0, R.A)();
        return ((0, i.useEffect)(() => {
          s(!0);
          let e = (0, n.P)((0, n.Cs)(o.kA, "ads"), (0, n.AB)(200)),
            a = (0, n.aQ)(
              e,
              (e) => {
                let a = e.docs.map((e) => ({ id: e.id, ...e.data() }));
                ((a = (a = a.filter(
                  (e) =>
                    "video" === e.adType ||
                    "فيديو" === e.adType ||
                    "image" === e.adType ||
                    "صوري" === e.adType ||
                    e.videoUrl,
                )).filter(
                  (e) =>
                    "active" === e.status ||
                    !0 === e.isActive ||
                    (!e.status && void 0 === e.isActive),
                )).sort((e, t) => {
                  let a =
                    e.timestamp ||
                    (e.postedAt ? new Date(e.postedAt).getTime() : 0);
                  return (
                    (t.timestamp ||
                      (t.postedAt ? new Date(t.postedAt).getTime() : 0)) - a
                  );
                }),
                  "all" !== u &&
                    (a = a.filter(
                      (e) => e.category === u || e.categoryId === u,
                    )),
                  "all" !== m &&
                    w &&
                    (a = a.filter((e) =>
                      e.village && "" !== e.village
                        ? w.village === e.village && "village" === m
                        : e.city && "" !== e.city
                          ? w.city === e.city &&
                            ("city" === m || "village" === m)
                          : !e.governorate ||
                            "" === e.governorate ||
                            ((w.province === e.governorate ||
                              w.governorate === e.governorate) &&
                              ("governorate" === m ||
                                "city" === m ||
                                "village" === m)),
                    )),
                  t(a),
                  a.length > 0 && !c && d(a[0].id),
                  s(!1));
              },
              (e) => {
                (console.error("Firestore Error:", e), s(!1));
              },
            );
          return () => a();
        }, [u, m, w]),
        (0, i.useEffect)(() => {
          if ("shorts" !== p) return;
          let e = new IntersectionObserver(
              (e) => {
                e.forEach((e) => {
                  e.isIntersecting && d(e.target.getAttribute("data-ad-id"));
                });
              },
              { root: j.current, threshold: 0.8 },
            ),
            t = () => {
              let a = document.querySelectorAll(".video-snap-item");
              if (a.length > 0) {
                if ((a.forEach((t) => e.observe(t)), c)) {
                  let e = document.querySelector(
                    '[data-ad-id="'.concat(c, '"]'),
                  );
                  e && e.scrollIntoView({ behavior: "instant" });
                }
              } else setTimeout(t, 50);
            };
          return (t(), () => e.disconnect());
        }, [e, p]),
        a)
          ? (0, r.jsxs)("div", {
              className:
                "flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-black text-white",
              children: [
                (0, r.jsx)(z.A, {
                  className: "w-12 h-12 animate-spin text-primary mb-4",
                }),
                (0, r.jsx)("p", {
                  className: "text-lg font-medium animate-pulse",
                  children: "جاري تحميل سوق بلدنا...",
                }),
              ],
            })
          : 0 === e.length
            ? (0, r.jsxs)("div", {
                className:
                  "flex flex-col items-center justify-center h-[calc(100vh-120px)] bg-black text-white p-6 text-center",
                children: [
                  (0, r.jsx)("div", {
                    className:
                      "w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mb-6",
                    children: (0, r.jsx)(A.A, {
                      className: "w-10 h-10 text-muted-foreground",
                    }),
                  }),
                  (0, r.jsx)("h2", {
                    className: "text-2xl font-bold mb-2",
                    children: "لا توجد إعلانات فيديو حالياً",
                  }),
                  (0, r.jsx)("p", {
                    className: "text-muted-foreground max-w-md",
                    children:
                      'كن أول من ينشر إعلان فيديو في منطقتك واظهر في "سوق بلدنا"!',
                  }),
                ],
              })
            : (0, r.jsxs)("div", {
                className:
                  "jsx-cbb5925584b659c6 relative h-[calc(100vh-64px)] bg-black flex flex-col w-full text-white overflow-hidden",
                children: [
                  (0, r.jsx)("div", {
                    className:
                      "jsx-cbb5925584b659c6 " +
                      ((0, M.cn)(
                        "z-50 pt-3 pb-2 transition-all duration-500 shrink-0",
                        "shorts" === p
                          ? "absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/40 to-transparent border-none"
                          : "relative bg-black border-b border-white/5 shadow-xl",
                      ) || ""),
                    children: (0, r.jsxs)("div", {
                      className:
                        "jsx-cbb5925584b659c6 max-w-[1600px] mx-auto px-4 space-y-3",
                      children: [
                        (0, r.jsx)(P, {
                          selectedCategory: u,
                          onSelect: (e) => {
                            (x(e), v("grid"));
                          },
                        }),
                        "grid" === p &&
                          (0, r.jsx)("div", {
                            className:
                              "jsx-cbb5925584b659c6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 animate-in fade-in slide-in-from-top-2",
                            children: (0, r.jsx)("div", {
                              className:
                                "jsx-cbb5925584b659c6 flex bg-white/5 backdrop-blur-xl rounded-full p-1 border border-white/10",
                              children: [
                                { id: "all", label: "كل البلاد", icon: U.A },
                                {
                                  id: "governorate",
                                  label:
                                    (null == w ? void 0 : w.province) ||
                                    (null == w ? void 0 : w.governorate) ||
                                    "المحافظة",
                                  icon: g.A,
                                },
                                {
                                  id: "city",
                                  label:
                                    (null == w ? void 0 : w.city) || "المدينة",
                                  icon: O.A,
                                },
                                {
                                  id: "village",
                                  label:
                                    (null == w ? void 0 : w.village) ||
                                    "القرية",
                                  icon: D.A,
                                },
                              ].map((e) => {
                                let t = e.icon,
                                  a = m === e.id;
                                return (0, r.jsxs)(
                                  "button",
                                  {
                                    onClick: () => f(e.id),
                                    className:
                                      "jsx-cbb5925584b659c6 " +
                                      ((0, M.cn)(
                                        "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                                        a
                                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                          : "hover:bg-white/10 text-white/60 hover:text-white",
                                      ) || ""),
                                    children: [
                                      (0, r.jsx)(t, {
                                        className:
                                          "jsx-cbb5925584b659c6 " +
                                          ((0, M.cn)(
                                            "w-3.5 h-3.5",
                                            a
                                              ? "animate-pulse"
                                              : "text-primary",
                                          ) || ""),
                                      }),
                                      (0, r.jsx)("span", {
                                        className:
                                          "jsx-cbb5925584b659c6 " +
                                          ((0, M.cn)(
                                            a ? "block" : "hidden sm:block",
                                          ) || ""),
                                        children: e.label,
                                      }),
                                    ],
                                  },
                                  e.id,
                                );
                              }),
                            }),
                          }),
                      ],
                    }),
                  }),
                  (0, r.jsxs)("div", {
                    className:
                      "jsx-cbb5925584b659c6 flex-1 relative w-full h-full overflow-hidden",
                    children: [
                      "grid" === p &&
                        (0, r.jsx)("div", {
                          className:
                            "jsx-cbb5925584b659c6 w-full h-full overflow-y-auto custom-scrollbar pb-20 pt-4 px-2 md:px-0",
                          children: (0, r.jsxs)("div", {
                            className:
                              "jsx-cbb5925584b659c6 max-w-[1800px] mx-auto",
                            children: [
                              (0, r.jsx)("div", {
                                className:
                                  "jsx-cbb5925584b659c6 px-6 md:px-8 mb-4",
                                children: (0, r.jsxs)("h1", {
                                  className:
                                    "jsx-cbb5925584b659c6 text-xl md:text-2xl font-black text-white flex items-center gap-2",
                                  children: [
                                    (0, r.jsx)("div", {
                                      className:
                                        "jsx-cbb5925584b659c6 w-8 h-8 rounded-lg bg-primary flex items-center justify-center",
                                      children: (0, r.jsx)(A.A, {
                                        className: "w-5 h-5 text-white",
                                      }),
                                    }),
                                    "سوق بلدنا",
                                  ],
                                }),
                              }),
                              (0, r.jsx)(I, {
                                ads: e,
                                onVideoClick: (e) => {
                                  (d(e), v("shorts"));
                                },
                              }),
                            ],
                          }),
                        }),
                      "shorts" === p &&
                        (0, r.jsxs)("div", {
                          className:
                            "jsx-cbb5925584b659c6 absolute inset-0 z-40 bg-black flex justify-center animate-in fade-in zoom-in-95 duration-500",
                          children: [
                            (0, r.jsx)(L.$, {
                              variant: "ghost",
                              size: "icon",
                              onClick: () => v("grid"),
                              className:
                                "absolute top-6 left-6 z-[60] bg-black/20 backdrop-blur-md text-white hover:bg-white/20 rounded-full border border-white/10",
                              children: (0, r.jsx)(C.A, {
                                className: "w-6 h-6",
                              }),
                            }),
                            (0, r.jsx)("div", {
                              className:
                                "jsx-cbb5925584b659c6 hidden lg:flex absolute top-6 right-6 z-[60] items-center gap-4",
                              children: (0, r.jsxs)("div", {
                                className:
                                  "jsx-cbb5925584b659c6 bg-primary/20 backdrop-blur-md px-4 py-2 rounded-full border border-primary/30 flex items-center gap-2",
                                children: [
                                  (0, r.jsx)("div", {
                                    className:
                                      "jsx-cbb5925584b659c6 w-2 h-2 rounded-full bg-primary animate-pulse",
                                  }),
                                  (0, r.jsx)("span", {
                                    className:
                                      "jsx-cbb5925584b659c6 text-[10px] font-black text-primary uppercase tracking-[0.2em]",
                                    children: "LIVE FEED",
                                  }),
                                ],
                              }),
                            }),
                            (0, r.jsx)("div", {
                              ref: j,
                              className:
                                "jsx-cbb5925584b659c6 w-full max-w-[450px] h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative bg-neutral-900",
                              children: e.map((e) =>
                                (0, r.jsx)(
                                  "div",
                                  {
                                    "data-ad-id": e.id,
                                    className:
                                      "jsx-cbb5925584b659c6 video-snap-item w-full h-full snap-start snap-always relative",
                                    children: (0, r.jsx)(k, {
                                      ad: e,
                                      isActive: "shorts" === p && c === e.id,
                                      isMuted: b,
                                      onToggleMute: () => h(!b),
                                    }),
                                  },
                                  e.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                    ],
                  }),
                  (0, r.jsx)(l(), {
                    id: "cbb5925584b659c6",
                    children:
                      ".hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.custom-scrollbar::-webkit-scrollbar{width:8px}.custom-scrollbar::-webkit-scrollbar-track{background:rgba(0,0,0,.4)}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:20px}.custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}",
                  }),
                ],
              });
      }
    },
    3998: (e, t, a) => {
      "use strict";
      a.d(t, { $: () => c, r: () => o });
      var r = a(95155),
        s = a(12115),
        l = a(32467),
        i = a(83101),
        n = a(64269);
      let o = (0, i.F)(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            variants: {
              variant: {
                default:
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                destructive:
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                  "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
              },
              size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
              },
            },
            defaultVariants: { variant: "default", size: "default" },
          },
        ),
        c = s.forwardRef((e, t) => {
          let { className: a, variant: s, size: i, asChild: c = !1, ...d } = e,
            u = c ? l.DX : "button";
          return (0, r.jsx)(u, {
            className: (0, n.cn)(o({ variant: s, size: i, className: a })),
            ref: t,
            ...d,
          });
        });
      c.displayName = "Button";
    },
    11647: (e, t, a) => {
      "use strict";
      a.d(t, { E: () => n });
      var r = a(95155);
      a(12115);
      var s = a(83101),
        l = a(64269);
      let i = (0, s.F)(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          variants: {
            variant: {
              default:
                "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
              secondary:
                "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
              destructive:
                "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
              outline: "text-foreground",
            },
          },
          defaultVariants: { variant: "default" },
        },
      );
      function n(e) {
        let { className: t, variant: a, ...s } = e;
        return (0, r.jsx)("div", {
          className: (0, l.cn)(i({ variant: a }), t),
          ...s,
        });
      }
    },
    15894: (e, t, a) => {
      "use strict";
      a.d(t, { dj: () => u, oR: () => d });
      var r = a(12115);
      let s = 0,
        l = new Map(),
        i = (e) => {
          if (l.has(e)) return;
          let t = setTimeout(() => {
            (l.delete(e), c({ type: "REMOVE_TOAST", toastId: e }));
          }, 1e6);
          l.set(e, t);
        },
        n = [],
        o = { toasts: [] };
      function c(e) {
        ((o = ((e, t) => {
          switch (t.type) {
            case "ADD_TOAST":
              return { ...e, toasts: [t.toast, ...e.toasts].slice(0, 1) };
            case "UPDATE_TOAST":
              return {
                ...e,
                toasts: e.toasts.map((e) =>
                  e.id === t.toast.id ? { ...e, ...t.toast } : e,
                ),
              };
            case "DISMISS_TOAST": {
              let { toastId: a } = t;
              return (
                a
                  ? i(a)
                  : e.toasts.forEach((e) => {
                      i(e.id);
                    }),
                {
                  ...e,
                  toasts: e.toasts.map((e) =>
                    e.id === a || void 0 === a ? { ...e, open: !1 } : e,
                  ),
                }
              );
            }
            case "REMOVE_TOAST":
              if (void 0 === t.toastId) return { ...e, toasts: [] };
              return {
                ...e,
                toasts: e.toasts.filter((e) => e.id !== t.toastId),
              };
          }
        })(o, e)),
          n.forEach((e) => {
            e(o);
          }));
      }
      function d(e) {
        let { ...t } = e,
          a = (s = (s + 1) % Number.MAX_SAFE_INTEGER).toString(),
          r = () => c({ type: "DISMISS_TOAST", toastId: a });
        return (
          c({
            type: "ADD_TOAST",
            toast: {
              ...t,
              id: a,
              open: !0,
              onOpenChange: (e) => {
                e || r();
              },
            },
          }),
          {
            id: a,
            dismiss: r,
            update: (e) => c({ type: "UPDATE_TOAST", toast: { ...e, id: a } }),
          }
        );
      }
      function u() {
        let [e, t] = r.useState(o);
        return (
          r.useEffect(
            () => (
              n.push(t),
              () => {
                let e = n.indexOf(t);
                e > -1 && n.splice(e, 1);
              }
            ),
            [e],
          ),
          {
            ...e,
            toast: d,
            dismiss: (e) => c({ type: "DISMISS_TOAST", toastId: e }),
          }
        );
      }
    },
    17037: (e, t, a) => {
      "use strict";
      a.d(t, { $: () => o, F: () => n });
      var r = a(95155),
        s = a(12115),
        l = a(59034),
        i = a(64269);
      let n = s.forwardRef((e, t) => {
        let { className: a, children: s, ...n } = e;
        return (0, r.jsxs)(l.bL, {
          ref: t,
          className: (0, i.cn)("relative overflow-hidden", a),
          ...n,
          children: [
            (0, r.jsx)(l.LM, {
              className: "h-full w-full rounded-[inherit]",
              children: s,
            }),
            (0, r.jsx)(o, {}),
            (0, r.jsx)(l.OK, {}),
          ],
        });
      });
      n.displayName = l.bL.displayName;
      let o = s.forwardRef((e, t) => {
        let { className: a, orientation: s = "vertical", ...n } = e;
        return (0, r.jsx)(l.VM, {
          ref: t,
          orientation: s,
          className: (0, i.cn)(
            "flex touch-none select-none transition-colors",
            "vertical" === s &&
              "h-full w-2.5 border-l border-l-transparent p-[1px]",
            "horizontal" === s &&
              "h-2.5 flex-col border-t border-t-transparent p-[1px]",
            a,
          ),
          ...n,
          children: (0, r.jsx)(l.lr, {
            className: "relative flex-1 rounded-full bg-border",
          }),
        });
      });
      o.displayName = l.VM.displayName;
    },
    64269: (e, t, a) => {
      "use strict";
      a.d(t, { cn: () => l });
      var r = a(2821),
        s = a(75889);
      function l() {
        for (var e = arguments.length, t = Array(e), a = 0; a < e; a++)
          t[a] = arguments[a];
        return (0, s.QP)((0, r.$)(t));
      }
    },
    75934: (e, t, a) => {
      Promise.resolve().then(a.bind(a, 1813));
    },
    85897: (e, t, a) => {
      "use strict";
      a.d(t, { BK: () => o, eu: () => n, q5: () => c });
      var r = a(95155),
        s = a(12115),
        l = a(63366),
        i = a(64269);
      let n = s.forwardRef((e, t) => {
        let { className: a, ...s } = e;
        return (0, r.jsx)(l.bL, {
          ref: t,
          className: (0, i.cn)(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
            a,
          ),
          ...s,
        });
      });
      n.displayName = l.bL.displayName;
      let o = s.forwardRef((e, t) => {
        let { className: a, src: s, ...n } = e;
        return (0, r.jsx)(l._V, {
          ref: t,
          src: s || void 0,
          className: (0, i.cn)("aspect-square h-full w-full", a),
          ...n,
        });
      });
      o.displayName = l._V.displayName;
      let c = s.forwardRef((e, t) => {
        let { className: a, ...s } = e;
        return (0, r.jsx)(l.H4, {
          ref: t,
          className: (0, i.cn)(
            "flex h-full w-full items-center justify-center rounded-full bg-muted",
            a,
          ),
          ...s,
        });
      });
      c.displayName = l.H4.displayName;
    },
  },
  (e) => {
    (e.O(
      0,
      [
        6764, 6595, 9461, 8568, 2619, 6417, 5449, 4909, 8329, 9034, 1211, 4898,
        2585, 1744, 4901, 8441, 1255, 7358,
      ],
      () => e((e.s = 75934)),
    ),
      (_N_E = e.O()));
  },
]);
