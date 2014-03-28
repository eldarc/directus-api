define([
  'app',
  'backbone',
  'core/modal',
  'core/edit',
  'core/BasePageView',
  'core/table/table.view',
  'modules/media/views/EditMediaView'
],

function(app, Backbone, DirectusModal, DirectusEdit, BasePageView, DirectusTable, EditMediaView) {

  var BodyView = Backbone.Layout.extend({

    tagName: 'ul',

    attributes: {
      class: "cards row"
    },

    events: {
      'click li': function(e) {
        var id = $(e.target).closest('li').attr('data-id');

        var user = app.users.getCurrentUser();
        var userGroup = user.get('group');

        //@todo fix this so it respects ACL instead of being hardcoded
        if (!(parseInt(id,10) === user.id || userGroup.id === 0)) {
          return;
        }

        app.router.go('#users', id);
      }
    },

    template: Handlebars.compile(
      '{{#rows}}' +
      '<li class="card col-2 gutter-bottom" data-id="{{id}}" data-cid="{{cid}}">' +
        '<div class="header-image">' +
          '<div class="default-info">PDF</div>' +
          '<div class="tool-item large-circle"><span class="icon icon-pencil"></span></div>' +
        '</div>' +
        '<div class="info">' +
          '<div class="featured">' +
            '<div class="primary-info">{{title}}</div>' +
            '<div class="secondary-info">666x666 | {{size}} | {{type}}</div>' +
            '<div class="secondary-info italic">{{date_uploaded}}</div>' +
          '</div>' +
        '</div>' +
      '</li>' +
      '{{/rows}}'
    ),

    serialize: function() {
      var rows = this.collection.map(function(model) {
        var data = {
          "id": model.get('id'),
          "cid": model.cid,
          'thumbnail': model.get('name'),
          'title': model.get('title'),
          'date_uploaded': moment(model.get('date_uploaded')).fromNow(),
          'size': model.get('size'),
          'type': model.get('type')
        };

        return data;
      });
      return {rows: rows};
    },

    initialize: function(options) {
      this.collection.on('sort', this.render, this);
      this.collection.on('sync', this.render, this);
    }

  });

  return BasePageView.extend({
    headerOptions: {
      route: {
        title: "Media"
      }
    },
    events: {
      'click #btn-top': function() {
        var model = new this.collection.model({},{collection: this.collection});
        this.addEditMedia(model, 'Add New Media');
      },
      'fileuploadprogress #fileupload': function(e, data) {
        console.log('progress...', data);
      },
      'fileuploaddone #fileupload': function(e, data) {
        console.log('done');
        this.collection.fetch();
      },
      'fileuploadfail #fileupload': function (e, data) {
        console.log('faiiilll!!!', e, data);
      },
      'click td:not(.check)': function(e) {
        var cid = $(e.target).closest('tr').attr('data-cid');
        var model = this.collection.get(cid);
        this.addEditMedia(model, 'Editing Media');
      }
    },

    addEditMedia: function(model, title) {
      var modal = new EditMediaView({model: model, stretch: true, title: title});
      app.router.v.messages.insertView(modal).render();
      if (!model.isNew()) {
        app.router.navigate('#media/'+model.id);
        modal.on('close', function() {
          app.router.navigate('#media');
        });
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.table);
      //this.setView('#page-content', new DirectusTable({collection:this.collection, selectable: true, droppable: true, deleteOnly: true, hideColumnPreferences: true, blacklist: ['storage_adapter']}));
      this.collection.fetch({reset: true});
    },
    initialize: function() {
      this.table = new BodyView({collection:this.collection});
    }
  });

});