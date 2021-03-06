(function() {
  var $$,
  CollapsibleSectionPanel,
  CompositeDisposable,
  ErrorView,
  PostsPanel,
  List,
  ListView,
  PostCard,
  _,
  TextEditorView,
  fuzzaldrin,
  ownerFromRepository,
  packageComparatorAscending,
  PostStatuses,
  postStatusesInstance,
  ref,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom-space-pen-views'), $$ = ref.$$, TextEditorView = ref.TextEditorView;

  CompositeDisposable = require('atom').CompositeDisposable;

  fuzzaldrin = require('fuzzaldrin');

  CollapsibleSectionPanel = require('./collapsible-section-panel');

  PostCard = require('./post-card');

  ErrorView = require('./error-view');

  List = require('./list');

  ListView = require('./list-view');

  _ = require('underscore-plus');

  PostStatuses = require('./post-statuses');

  postStatusesInstance = new PostStatuses();

  module.exports = PostsPanel = (function(superClass) {
    extend(PostsPanel, superClass);

    function PostsPanel() {
      this.createPostCard = bind(this.createPostCard, this);
      return PostsPanel.__super__.constructor.apply(this, arguments);
    }

    PostsPanel.loadPostsDelay = 300;

    PostsPanel.content = function() {
      return this.div({
        "class": 'panels-item'
      }, (function(_this) {
        return function() {
          _this.section({
            "class": 'section'
          }, function() {
            return _this.div({
              "class": 'section-container'
            }, function() {
              _this.div({
                "class": 'section-heading icon icon-pencil'
              }, function() {
                _this.text('My Posts');
                return _this.span({
                  outlet: 'totalPosts',
                  "class": 'section-heading-count badge badge-flexible'
                }, '…');
              });
              _this.div({
                "class": 'hidden',
                outlet: 'emptySection'
              }, function() {
                _this.h3({}, 'Your post list is empty');
                return _this.button({
                  type: 'button',
                  'class': 'btn icon icon-pencil',
                  outlet: 'createButton'
                }, function() {
                  return _this.raw('Create Post')
                });
              });
              _this.div({
                "class": 'editor-container',
                outlet: 'searchSection'
              }, function() {
                return _this.subview('filterEditor', new TextEditorView({
                  mini: true,
                  placeholderText: 'Filter posts by title'
                }));
              });
              _this.div({
                outlet: 'updateErrors'
              });

              _this.section({
                outlet: 'publicSection',
                "class": 'sub-section public-posts'
              }, function() {
                _this.h3({
                  outlet: 'publicPostsHeader',
                  "class": 'sub-section-heading icon icon-eye'
                }, function() {
                  _this.text('Public Posts');
                  return _this.span({
                    outlet: 'publicCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'publicPosts',
                  "class": 'container posts-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading posts…");
                });
              });

              _this.section({
                outlet: 'draftSection',
                "class": 'sub-section draft-posts'
              }, function() {
                _this.h3({
                  outlet: 'draftPostsHeader',
                  "class": 'sub-section-heading icon icon-lock'
                }, function() {
                  _this.text('Draft Posts');
                  return _this.span({
                    outlet: 'draftCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'draftPosts',
                  "class": 'container posts-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading posts…");
                });
              });

              _this.section({
                outlet: 'draftPublicSection',
                "class": 'sub-section draft-public-posts'
              }, function() {
                _this.h3({
                  outlet: 'draftPublicPostsHeader',
                  "class": 'sub-section-heading icon viblo-unlocked'
                }, function() {
                  _this.text('Public Draft Posts');
                  return _this.span({
                    outlet: 'draftPublicCount',
                    "class": 'section-heading-count badge badge-flexible'
                  }, '…');
                });
                return _this.div({
                  outlet: 'draftPublicPosts',
                  "class": 'container posts-container'
                }, function() {
                  return _this.div({
                    "class": 'alert alert-info loading-area icon icon-hourglass'
                  }, "Loading posts…");
                });
              });
            });
          });
          return _this.section({'class':'section'}, ' ');
        };
      })(this));
    };

    PostsPanel.prototype.findPost = function(slug) {
      var ref, i, j, len, len2;
      if (!this.posts) {
        return;
      }
      ref = ['public', 'draft', 'draft_public'];
      for (i = 0, len = ref.length; i < len; i++) {
        var ref2 = this.posts[ref[i]];
        for (j = 0, len2 = ref2.length; j < len2; j++) {
          if (ref2[j].slug === slug) {
            return ref2[j];
          }
        }
      }
    }

    PostsPanel.prototype.initialize = function(postManager) {
      this.postManager = postManager;
      this.posts = {};
      this.posts.public = [];
      this.posts.draft = [];
      this.posts.draft_public = [];
      PostsPanel.__super__.initialize.apply(this, arguments);
      this.items = {
        public: new List('slug'),
        draft: new List('slug'),
        draft_public: new List('slug')
      };
      this.itemViews = {
        public: new ListView(this.items.public, this.publicPosts, this.createPostCard),
        draft: new ListView(this.items.draft, this.draftPosts, this.createPostCard),
        draft_public: new ListView(this.items.draft_public, this.draftPublicPosts, this.createPostCard)
      };

      this.items.public.onDidAddItem((function(_this) {
          return function(post) {
            _this.postManager.savePostToFile(post);
          };
      })(this));

      this.items.draft.onDidAddItem((function(_this) {
          return function(post) {
            _this.postManager.savePostToFile(post);
          };
      })(this));

      this.items.draft_public.onDidAddItem((function(_this) {
          return function(post) {
            _this.postManager.savePostToFile(post);
          };
      })(this));

      this.filterEditor.getModel().onDidStopChanging((function(_this) {
        return function() {
          return _this.matchPosts();
        };
      })(this));

      this.postManagerSubscriptions = new CompositeDisposable;
      this.postManagerSubscriptions.add(this.postManager.on('post-save-as-draft-failed post-save-as-draft-public-failed post-publish-failed ', (function(_this) {
        return function(arg) {
          var error, post;
          post = arg.post, error = arg.error;
          return _this.updateErrors.append(new ErrorView(error));
        };
      })(this)));

      loadPostsTimeout = null;

      this.postManagerSubscriptions.add(this.postManager.on('post-published post-saved-as-draft post-saved-as-draft-public', (function(_this) {
        return function(post) {
          clearTimeout(loadPostsTimeout);
          return loadPostsTimeout = setTimeout(function() {
            return _this.loadPosts();
          }, PostsPanel.loadPostsDelay);
        };
      })(this)));

      this.createButton.on('click', function() {
        atom.commands.dispatch(atom.views.getView(atom.workspace.getActivePane()), 'application:new-file');
      });

      this.handleEvents();
      this.loadPosts();
    };

    PostsPanel.prototype.focus = function() {
      return this.filterEditor.focus();
    };

    PostsPanel.prototype.dispose = function() {
      return this.postManagerSubscriptions.dispose();
    };

    PostsPanel.prototype.resetSectionHasItems = function() {
      return this.resetCollapsibleSections([this.publicPostsHeader, this.draftPostsHeader, this.draftPublicPostsHeader]);
    };

    PostsPanel.prototype.updateUnfilteredSectionCounts = function() {
      this.updateSectionCount(this.publicPostsHeader, this.publicCount, this.posts.public.length);
      this.updateSectionCount(this.draftPostsHeader, this.draftCount, this.posts.draft.length);
      this.updateSectionCount(this.draftPublicPostsHeader, this.draftPublicCount, this.posts.draft_public.length);
      return this.totalPosts.text(this.posts.public.length + this.posts.draft.length + this.posts.draft_public.length);
    };

    PostsPanel.prototype.updateFilteredSectionCounts = function() {
      var public, draft, draft_public, shownPosts, totalPosts;

      public = this.notHiddenCardsLength(this.publicPosts);
      this.updateSectionCount(this.publicPostsHeader, this.publicCount, public, this.posts.public.length);

      draft = this.notHiddenCardsLength(this.draftPosts);
      this.updateSectionCount(this.draftPostsHeader, this.draftCount, draft, this.posts.draft.length);

      draft_public = this.notHiddenCardsLength(this.draftPublicPosts);
      this.updateSectionCount(this.draftPublicPostsHeader, this.draftPublicCount, draft_public, this.posts.draft_public.length);

      shownPosts = public + draft + draft_public;
      totalPosts = this.posts.public.length + this.posts.draft.length + this.posts.draft_public.length;
      return this.totalPosts.text(shownPosts + "/" + totalPosts);
    };



    PostsPanel.prototype.loadPosts = function() {
      var publicPostPromise = this.postManager.getPublished();
      var draftPostPromise = this.postManager.getDrafts();
      var draftPublicPostPromise = this.postManager.getDraftPublished();

      Promise.all([publicPostPromise, draftPostPromise, draftPublicPostPromise]).then((function(_this) {
        return function() {
          var totalPosts = _this.posts.public.length + _this.posts.draft.length + _this.posts.draft_public.length;
          _this.totalPosts.text(totalPosts);
          if (totalPosts < 1) {
            _this.totalPosts.addClass('hidden');
            _this.searchSection.addClass('hidden');
            _this.emptySection.removeClass('hidden');
          } else {
            _this.totalPosts.removeClass('hidden');
            _this.searchSection.removeClass('hidden');
            _this.emptySection.addClass('hidden');
          }
        };
      })(this))["catch"]((function(_this) {
        return function(error) {
          console.error(error.message, error.stack);
          eventArg.error = error;
          return _this.emitter.emit('post-load-fail', eventArg);
        };
      })(this));

      publicPostPromise.then((function(_this) {
        return function(result) {
          if (!result.success) {
            _this.searchSection.addClass('hidden');
            _this.updateErrors.html(new ErrorView({message:result.statusText}));
            return _this.publicSection.addClass('hidden');
          }
          var data = result.data.length > 0 ? result.data : [];
          data = _.filter(data, function(post, idx) {
            return post.status === postStatusesInstance.STATUS_PUBLIC;
          });
          data = data.sort(function(a, b) {
            return a['id'] > b['id'];
          });
          if (data.length == 0) {
            _this.publicSection.addClass('hidden');
          } else {
            _this.publicSection.removeClass('hidden');
          }
          _this.posts.public = data;
          _this.publicPosts.find('.alert.loading-area').remove();
          _this.items.public.setItems(data);
          _this.updateSectionCount(_this.publicPostsHeader, _this.publicCount, _this.posts.public.length);
          _this.updateUnfilteredSectionCounts();
          return _this.matchPosts();
        };
      })(this))["catch"](this.catchLoadingError);


      draftPostPromise.then((function(_this) {
        return function(result) {
          if (!result.success) {
            _this.searchSection.addClass('hidden');
            _this.updateErrors.html(new ErrorView({message:result.statusText}));
            return _this.draftSection.addClass('hidden');
          }
          var data = result.data.length > 0 ? result.data : [];
          data = _.filter(data, function(post, idx) {
            return post.status === postStatusesInstance.STATUS_DRAFT;
          });
          data = data.sort(function(a, b) {
            return a['id'] > b['id'];
          });
          if (data.length == 0) {
            _this.draftSection.addClass('hidden');
          } else {
            _this.draftSection.removeClass('hidden');
          }

          _this.posts.draft = data;
          _this.draftPosts.find('.alert.loading-area').remove();
          _this.items.draft.setItems(data);
          _this.updateSectionCount(_this.draftPostsHeader, _this.draftCount, _this.posts.draft.length);
          _this.updateUnfilteredSectionCounts();
          return _this.matchPosts();
        };
      })(this))["catch"](this.catchLoadingError);

      draftPublicPostPromise.then((function(_this) {
        return function(result) {
          if (!result.success) {
            _this.searchSection.addClass('hidden');
            _this.updateErrors.html(new ErrorView({message:result.statusText}));
            return _this.draftPublicSection.addClass('hidden');
          }
          var data = result.data.length > 0 ? result.data : [];
          data = _.filter(data, function(post, idx) {
            return post.status === postStatusesInstance.STATUS_DRAFT_PUBLIC;
          });
          data = data.sort(function(a, b) {
            return a['id'] > b['id'];
          });
          if (data.length == 0) {
            _this.draftPublicSection.addClass('hidden');
          } else {
            _this.draftPublicSection.removeClass('hidden');
          }
          _this.posts.draft_public = data;
          _this.draftPublicPosts.find('.alert.loading-area').remove();
          _this.items.draft_public.setItems(data);
          _this.updateSectionCount(_this.draftPublicPostsHeader, _this.draftPublicCount, _this.posts.draft_public.length);
          _this.updateUnfilteredSectionCounts();
          return _this.matchPosts();
        };
      })(this))["catch"](this.catchLoadingError);
    };

    PostsPanel.prototype.catchLoadingError = (function(_this) {
      return function(error) {
        console.error(error.message, error.stack);
        return _this.updateErrors.append(new ErrorView(error));
      };
    })(this)


    PostsPanel.prototype.matchPosts = function() {
      var filterText;
      filterText = this.filterEditor.getModel().getText();
      return this.filterPostsListByText(filterText);
    };

    PostsPanel.prototype.filterPostsListByText = function(text) {
      var activeViews, allViews, i, j, k, len, len1, len2, ref2, view;
      if (!this.posts) {
        return;
      }
      ref2 = ['public', 'draft', 'draft_public'];
      for (i = 0, len = ref2.length; i < len; i++) {
        postStatus = ref2[i];
        allViews = this.itemViews[postStatus].getViews();
        activeViews = this.itemViews[postStatus].filterViews(function(post) {
          var filterText, owner, ref3;
          if (text === '') {
            return true;
          }
          filterText = post.title;
          return fuzzaldrin.score(filterText, text) > 0;
        });
        for (j = 0, len1 = allViews.length; j < len1; j++) {
          view = allViews[j];
          if (view) {
            view.find('.post-card').addClass('hidden');
          }
        }
        for (k = 0, len2 = activeViews.length; k < len2; k++) {
          view = activeViews[k];
          if (view) {
            view.find('.post-card').removeClass('hidden');
          }
        }
      }
      return this.updateSectionCounts();
    };

    PostsPanel.prototype.createPostCard = function(post) {
      var postView, postRow;
      postRow = $$(function() {
        return this.div({
          "class": 'row'
        });
      });
      postView = new PostCard(post, this.postManager, {
        back: 'Posts'
      });
      postRow.append(postView);
      return postRow;
    };


    return PostsPanel;

  })(CollapsibleSectionPanel);

}).call(this);
