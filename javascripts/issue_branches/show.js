with (scope('PullRequest', 'App')) {
  route('#repos/:login/:repository/issues/:issue_number/issue_branch', function(login, repository, issue_number) {
    var target_div = div('Loading...');

    render(
      breadcrumbs(
        a({ href: '#' }, 'Home'),
        a({ href: '#repos/' + login + '/' + repository }, login + '/' + repository),
        a({ href: '#repos/' + login + '/' + repository + '/issues' }, 'Issues'),
        a({ href: '#repos/' + login + '/' + repository + '/issues/' + issue_number }, '#' + issue_number),
        ('My Issue Branch')
      ),
      target_div
    );

    Issue.get_solution(issue_number, function(solution) {
      var commits_div = div('Loading...'),
          submit_div = div();

      solution && render({ into: target_div },
        div({ 'class': 'split-main' },
          commits_div
        ),
        div({ 'class': 'split-side' },
          div({ style: 'background: #F1F1F1; padding: 0 21px 21px 21px; margin: 20px 15px; border-left: 1px solid #CCC; border-right: 1px solid #CCC; border-bottom: 1px solid #CCC;' },
            ribbon_header('GitHub Links'),
            br(),
            a({ 'class': 'green', target: '_blank', href: solution.head.repository.url+'/tree/'+solution.head.name }, 'Your Branch'),
            br(),
            a({ 'class': 'green', target: '_blank', href: solution.base.repository.url }, 'Base Repository'),

            submit_div
          )
        ),
        div({ 'class': 'split-end' })
      );

      if (!solution) {
        set_route('#repos/'+login+'/'+repository+'/issues/'+issue_number);
      } else {
        var advanced_box = div({ id: 'advanced-issue-branch-box', style: "margin: 10px 0; display: none"},
          b('Title: '), br(),
          text({ name: 'title', value: 'Fixes issue#'+solution.issue.number, style: 'width: 100%' }), br(),
          b('Body: '), br(),
          textarea({ name: 'body', style: 'width: 100%; height: 150px' })
        );

        if (solution.commits.length <= 0) {
          // show git instructions
          render({ into: commits_div },
            h3('What Now?'),
            p("To earn the bounty for this issue, you must commit your solution to the ", b('issue branch'), " that has been created for you."),
            br(),

            h3('Before Getting Started'),
            p("You will need to install and setup ", b('git'), ". Don't know what that is? Don't know if you have it installed? Just follow ", a({ target: '_blank', href: 'https://help.github.com/articles/set-up-git' }, 'this guide'), " to the end, and you will be ready to work."),
            br(),

            h3("Start Working on Your Issue Branch"),
            p("On GitHub, you now have your own copy of ", b(solution.base.repository.name), ", which is called ", b(solution.head.repository.full_name), ". To start working on your solution:"),

            ol(
              li(
                p("Navigate to the directory from which you want to work."),
                code("cd ~/my_projects")
              ),
              li(
                p("Clone the repository from GitHub. This may take a while, depending on the size of the repository that you forked."),
                code('git clone git@github.com:'+solution.head.repository.full_name+'.git')
              ),
              li(
                p("Woohoo, you now have your own copy of ", solution.base.repository.name, "! Before you get started, you must tell git to use the ", b('issue branch'), " created by BountySource."),
                code('cd '+solution.base.repository.name+'\ngit checkout '+solution.head.name)
              )
            ),

            p("That's it! Now, when you commit code, you will be appending the changes to your ", b('issue branch'), ". Once you have made some changes to your branch, they will show up here."),
            br(),

            h3("My Commits are not Shown!"),
            p("Chances are you did not commit your changes to the designated ", b("issue branch"), ". Run the following command inside of your repository directory:"),
            code('git symbolic-ref HEAD'),
            p("If the response does not match:"),
            code('refs/heads/'+solution.head.name),
            p("Then you need to switch back to the issue branch. Take note of the response to that previous command, and run the following:"),
            code('git checkout '+solution.head.name+'\ngit merge refs/heads/master'),
            p("For that second command, replace 'refs/heads/master' with whatever was returned before."),
            p("If you run into any problems during the merge, you can consult the ", a({ href: 'http://git-scm.com/docs/git-merge' }, 'git documentation'), " for help"),
            br(),

            h3('Additional Help'),
            p("If you need additional help with Git or GitHub, you may find the following links useful"),
            ul(
              li(a({ target: '_blank', href: '#faq' }, 'BountySource FAQs')),
              li(a({ target: '_blank', href: 'https://help.github.com' }, 'GitHub help')),
              li(a({ target: '_blank', href: 'http://git-scm.com/docs' }, 'Git documentation'))
            )
          );
        } else if (solution.pull_request) {
          // where there is normally a submit solution button, render a view solution button that links to GitHub
          render({ into: submit_div },
            br(),
            a({ 'class': 'blue', target: '_blank', href: '' }, 'Your Submission')
          );

          // pull request
          render({ into: commits_div },
            div({ style: 'padding: 5px 20px; margin-bottom: 15px; border-radius: 3px; background: #DFF7CB;'},
              p("Your solution has been submitted, and is awaiting review by the project committers.")
            ),
            commits_table(solution)
          );
        } else {
          // show submit button
          render({ into: submit_div },
            br(),
            shy_form_during_submit('Submitting Solution...'),
            shy_form({ action: curry(submit_solution, login, repository, issue_number) },
              div({ id: 'errors' }),
              advanced_box,
              submit({ 'class': 'blue' }, 'Submit Solution'),
              div({ style: 'text-align: right; font-size: 11px' }, '(', a({ href: curry(show, advanced_box) }, 'advanced'), ')')
            )
          );

          // show commits
          render({ into: commits_div }, commits_table(solution));
        }
      }
    });
  });

  define('commits_table', function(solution) {
    return table(
      tr(
        th({ style: 'width: 50px;' }),
        th({ style: 'width: 100px;' }, 'SHA'),
        th('Message')
      ),
      solution.commits.map(function(commit) {
        return tr(
          td(img({ src: commit.user.avatar_url, style: 'width: 35px;' })),
          td(a({ target: '_blank', href: solution.head.repository.url+'/commit/'+commit.sha }, commit.sha.substr(0,7))),
          td(commit.message)
        )
      })
    );
  })

  define('submit_solution', function(login, repository, issue_number, form_data) {
    render({ into: 'errors' },'');

    BountySource.submit_solution(login, repository, issue_number, { title: form_data.title, body: form_data.body + ' (Fixes Issue #'+issue_number+')' }, function(response) {
      if (response.meta.success) {
        set_route('#repos/'+login+'/'+repository+'/issues/'+issue_number+'/issue_branch', { reload_page: true });
      } else {
        show_shy_form();
        render({ into: 'errors' }, div({ style: 'padding: 20px;'}, response.data.error));
      }
    });
  });
};