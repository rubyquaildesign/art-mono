set here (pwd)
for pk in (cat ./_prompts.txt)
  cookiecutter --no-input ../../templates/genuary-template "pack_name=$pk" 
  cd $pk
  yarn;
  cd $here
end
