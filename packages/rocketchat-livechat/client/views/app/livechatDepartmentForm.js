Template.livechatDepartmentForm.helpers({
	department() {
		// return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get() : { enabled: true };
		return Template.instance().department.get();
	},
	agents() {
		return Template.instance().department && !_.isEmpty(Template.instance().department.get()) ? Template.instance().department.get().agents : []
	},
	selectedAgents() {
		return _.sortBy(Template.instance().selectedAgents.get(), 'username');
	},
	availableAgents() {
		var selected = _.pluck(Template.instance().selectedAgents.get(), 'username');
		return AgentUsers.find({ username: { $nin: selected }}, { sort: { username: 1 } });
	}
});

Template.livechatDepartmentForm.events({
	'submit #department-form' (e, instance) {
		e.preventDefault();
		var $btn = instance.$('button.save');

		var _id = $(e.currentTarget).data('id');
		var enabled = instance.$('input[name=enabled]:checked').val()
		var name = instance.$('input[name=name]').val()
		var description = instance.$('textarea[name=description]').val()

		if (enabled !== "1" && enabled !== "0") {
			return toastr.error(t('Please_select_enabled_yes_or_no'));
		}

		if (name.trim() === '') {
			return toastr.error(t('Please_fill_a_name'));
		}

		var oldBtnValue = $btn.html();
		$btn.html(t('Saving'));

		// agents = instance.department && !_.isEmpty(instance.department.get()) ? instance.department.get().agents : [];

		var departmentData = {
			enabled: enabled === "1" ? true : false,
			name: name.trim(),
			description: description.trim()
			// agents: agents
		};

		var departmentAgents = [];

		instance.selectedAgents.get().forEach((agent) => {
			agent.count = instance.$('.count-' + agent._id).val();
			agent.order = instance.$('.order-' + agent._id).val();

			departmentAgents.push(agent);
		});


		Meteor.call('livechat:saveDepartment', _id, departmentData, departmentAgents, function(error, result) {
			$btn.html(oldBtnValue);
			if (error) {
				return toastr.error(t(error.reason || error.error));
			}

			toastr.success(t('Saved'));
			FlowRouter.go('livechat-departments');
		});
	},

	'click button.back' (e, instance) {
		e.preventDefault();
		FlowRouter.go('livechat-departments');
	},

	// 'click button.add-agent' (e, instance) {
	// 	e.preventDefault();
	// 	var $btn = $(e.currentTarget);

	// 	var $agent = instance.$('input[name=agent]')

	// 	if ($agent.val().trim() === '') {
	// 		return toastr.error(t('Please_fill_a_username'));
	// 	}

	// 	var oldBtnValue = $btn.html();
	// 	$btn.html(t('Saving'));

	// 	Meteor.call('livechat:searchAgent', $agent.val(), function(error, user) {
	// 		$btn.html(oldBtnValue);
	// 		if (error) {
	// 			return toastr.error(t(error.reason || error.error));
	// 		}
	// 		department = instance.department.get() || {};
	// 		if (department.agents === undefined || !_.isArray(department.agents)) {
	// 			department.agents = [];
	// 		}
	// 		if (!_.findWhere(department.agents, { _id: user._id })) {
	// 			department.agents.push(user);
	// 		}
	// 		instance.department.set(department);
	// 		$agent.val('');
	// 	});
	// },

	'click .remove-agent' (e, instance) {
		e.preventDefault();

		var selectedAgents = instance.selectedAgents.get();
		selectedAgents = _.reject(selectedAgents, (agent) => { return agent._id === this._id });
		instance.selectedAgents.set(selectedAgents);
	},

	'click .available-agents li' (e, instance) {
		var selectedAgents = instance.selectedAgents.get();
		selectedAgents.push(this);
		instance.selectedAgents.set(selectedAgents);
	}
});

Template.livechatDepartmentForm.onCreated(function() {
	this.department = new ReactiveVar({ enabled: true });
	this.selectedAgents = new ReactiveVar([]);

	this.subscribe('livechat:agents');

	this.autorun(() => {
		var sub = this.subscribe('livechat:departments', FlowRouter.getParam('_id'));
		if (sub.ready()) {
			department = LivechatDepartment.findOne({ _id: FlowRouter.getParam('_id') });
			if (department) {
				this.department.set(department);

				this.subscribe('livechat:departmentAgents', department._id);
			}
		}
	});
});
